const axios = require('axios');
const admin = require('firebase-admin');
const multipart = require('parse-multipart-data');
const pdf = require('pdf-parse');
require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer);
    return data.text; // Return the full text
  } catch (error) {
    throw new Error('PDF를 분석하는 중 오류가 발생했습니다.');
  }
}

async function analyzeTextWithOpenAI(text, openaiApiKey) {
  try {
    const prompt = `
      아래 텍스트에서 학생의 번호, 이름, 평가 결과를 추출하여 JSON 형식으로 반환하세요.
      예시: [{ "번호": "1", "이름": "강나연", "자신과의 관계": "상", "타인과의 관계": "상", "자연-초월과의 관계": "상" }, ...]

      텍스트:
      ${text}
    `;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        n: 1,
        stop: null,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    const result = response.data.choices[0].message.content.trim();
    return JSON.parse(result);

  } catch (error) {
    console.error('OpenAI API 요청 중 오류 발생:', error.response ? error.response.data : error.message);
    throw new Error('텍스트 분석 중 오류가 발생했습니다.');
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const contentType = event.headers['content-type'];
    let text = '';
    let requestBody;

    if (contentType && contentType.includes('multipart/form-data')) {
      const boundary = multipart.getBoundary(contentType);
      const parts = multipart.parse(Buffer.from(event.body, 'base64'), boundary);

      let pdfBuffer;
      for (const part of parts) {
        if (part.filename) {
          pdfBuffer = part.data;
        } else if (part.name === 'type') {
          requestBody = JSON.parse(part.data.toString());
        }
      }

      if (!pdfBuffer) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'PDF 파일이 업로드되지 않았습니다.' }),
        };
      }

      text = await extractTextFromPDF(pdfBuffer);
    } else {
      requestBody = JSON.parse(event.body);
    }

    const { type, index } = requestBody;

    if (type === 'initial') {
      const studentData = await analyzeTextWithOpenAI(text, process.env.OPENAI_API_KEY);
      const totalStudents = studentData.length;

      await db.collection('studentData').doc('data').set({ studentData });

      return {
        statusCode: 200,
        body: JSON.stringify({ totalStudents }),
      };
    } else if (type === 'student') {
      const studentDataDoc = await db.collection('studentData').doc('data').get();
      const studentData = studentDataDoc.data().studentData;

      if (index >= studentData.length) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid student index' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(studentData[index]),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request type' }),
      };
    }
  } catch (error) {
    console.error('오류:', error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '데이터를 처리하는 중 오류가 발생했습니다.', details: error.message }),
    };
  }
};
