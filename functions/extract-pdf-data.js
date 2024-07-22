const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const multipart = require('parse-multipart-data');
const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function extractTextFromPDF(pdfBuffer) {
  try {
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      fullText += text + '\n';
    }
    return fullText;
  } catch (error) {
    console.error('PDF 텍스트 추출 오류:', error);
    throw new Error('PDF에서 텍스트를 추출하는 중 오류가 발생했습니다.');
  }
}

async function extractEvaluationCriteria(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
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
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
    console.error('OpenAI API 오류:', error);
    throw new Error('평가 기준 추출 중 오류가 발생했습니다: ' + error.message);
  }
}

async function extractTotalStudents(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
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
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
    console.error('OpenAI API 오류:', error);
    throw new Error('총 학생 수 추출 중 오류가 발생했습니다: ' + error.message);
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const contentType = event.headers['content-type'];
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('multipart/form-data')) {
      const boundary = multipart.getBoundary(contentType);
      const parts = multipart.parse(Buffer.from(event.body, 'base64'), boundary);
      let pdfBuffer;

      for (const part of parts) {
        if (part.filename && part.filename.endsWith('.pdf')) {
          pdfBuffer = part.data;
          console.log('PDF file received');
          break;
        }
      }

      if (!pdfBuffer) {
        console.log('PDF file not found in request');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'PDF 파일이 업로드되지 않았습니다.' }),
        };
      }

      const fullText = await extractTextFromPDF(pdfBuffer);
      console.log('Extracted text length:', fullText.length);
      
      const evaluationCriteria = await extractEvaluationCriteria(fullText);
      const totalStudents = await extractTotalStudents(fullText);
      console.log('Extracted evaluation criteria:', evaluationCriteria);
      console.log('Total students:', totalStudents);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...evaluationCriteria,
          총학생수: totalStudents,
          fullText
        }),
      };

    } else {
      console.log('Invalid content type:', contentType);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '잘못된 요청 형식입니다.' }),
      };
    }
  } catch (error) {
    console.error('Error details:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '처리 중 오류가 발생했습니다.', details: error.message }),
    };
  }
};
