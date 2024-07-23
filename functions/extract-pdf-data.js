const pdfParse = require('pdf-parse');
const multipart = require('parse-multipart-data');
const axios = require('axios');
const admin = require('firebase-admin');

// 환경 변수 로드
require('dotenv').config();

// Firebase Admin SDK 초기화
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
    const data = await pdfParse(pdfBuffer);
    console.log("Extracted text from PDF:", data.text);  // 추출된 텍스트를 콘솔에 로깅
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error('PDF에서 텍스트를 추출하는 중 오류가 발생했습니다.');
  }
}

async function extractEvaluationCriteria(text, apiKey) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts evaluation criteria from text. Always respond with valid JSON."
          },
          {
            role: "user",
            content: `텍스트에서 영역과 성취기준, 평가요소를 추출하여 JSON 형식으로 반환해주세요. 형식: { "영역": [영역들], "성취기준": [성취기준들], "평가요소": [평가요소들] }. Text: ${text}`
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error extracting evaluation criteria:", error);
    throw new Error('평가 기준 추출 중 오류가 발생했습니다: ' + error.message);
  }
}

async function extractTotalStudents(text, apiKey) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts the total number of students from text. Always respond with valid JSON."
          },
          {
            role: "user",
            content: `텍스트에서 총 학생 수를 추출하여 JSON 형식으로 반환해주세요. 형식: { "총학생수": 숫자 }. Text: ${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    
    const result = JSON.parse(jsonString);
    return result.총학생수;
  } catch (error) {
    console.error("Error extracting total students:", error);
    throw new Error('총 학생 수 추출 중 오류가 발생했습니다: ' + error.message);
  }
}

async function getApiKey(userId, teacherId) {
  let openaiApiKey = process.env.OPENAI_API_KEY; // 기본 환경변수에 설정된 키

  if (teacherId) {
    const teacherDocRef = db.collection('users').doc(teacherId.trim());
    const teacherDoc = await teacherDocRef.get();

    if (teacherDoc.exists) {
      const teacherData = teacherDoc.data();
      if (teacherData.openaiKey) {
        openaiApiKey = teacherData.openaiKey;
      }
    } else {
      console.error("Teacher not found:", teacherId);
      throw new Error('Teacher not found');
    }
  } else if (userId) {
    const userDocRef = db.collection('users').doc(userId.trim());
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.openaiKey) {
        openaiApiKey = userData.openaiKey;
      }
    }
  }

  if (!openaiApiKey) {
    console.error("API key not found for user:", userId);
    throw new Error('API key not found');
  }

  return openaiApiKey;
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const contentType = event.headers['content-type'];
    
    if (contentType && contentType.includes('multipart/form-data')) {
      const boundary = multipart.getBoundary(contentType);
      const parts = multipart.parse(Buffer.from(event.body, 'base64'), boundary);
      let pdfBuffer;
      let userId;
      let teacherId;

      for (const part of parts) {
        if (part.name === 'userId') {
          userId = part.data.toString();
        } else if (part.name === 'teacherId') {
          teacherId = part.data.toString();
        } else if (part.filename && part.filename.endsWith('.pdf')) {
          pdfBuffer = part.data;
        }
      }

      if (!pdfBuffer) {
        console.error("PDF file not uploaded");
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'PDF 파일이 업로드되지 않았습니다.' }),
        };
      }

      if (!userId && !teacherId) {
        console.error("User ID or Teacher ID not provided");
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'User ID 또는 Teacher ID가 제공되지 않았습니다.' }),
        };
      }

      const openaiApiKey = await getApiKey(userId, teacherId);

      const fullText = await extractTextFromPDF(pdfBuffer);
      
      const evaluationCriteria = await extractEvaluationCriteria(fullText, openaiApiKey);
      const totalStudents = await extractTotalStudents(fullText, openaiApiKey);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...evaluationCriteria,
          총학생수: totalStudents,
          fullText
        }),
      };

    } else {
      console.error("Invalid request format");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '잘못된 요청 형식입니다.' }),
      };
    }
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '처리 중 오류가 발생했습니다.', details: error.message }),
    };
  }
};