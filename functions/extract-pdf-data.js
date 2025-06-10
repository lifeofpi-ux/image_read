const pdfParse = require('pdf-parse');
const multipart = require('parse-multipart-data');
const axios = require('axios');
const admin = require('firebase-admin');

// 환경 변수 로드
require('dotenv').config();

// Firebase Admin SDK 초기화
let db = null;
let firebaseInitialized = false;

if (!admin.apps.length) {
  try {
    // Private key 처리 개선
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (privateKey) {
      // 로컬 환경에서 따옴표로 감싸진 경우 제거
      privateKey = privateKey.replace(/^"(.*)"$/, '$1');
      // 이스케이프된 개행 문자를 실제 개행 문자로 변환
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    db = admin.firestore();
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK 초기화 성공');
  } catch (error) {
    console.error('❌ Firebase Admin SDK 초기화 실패:', error.message);
    console.warn('⚠️ Firebase 기능 없이 기본 API 키로만 동작합니다.');
    firebaseInitialized = false;
  }
} else {
  db = admin.firestore();
  firebaseInitialized = true;
}

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
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts evaluation criteria from text. Always respond with valid JSON."
          },
          {
            role: "user",
            content: `텍스트에서 영역과 성취기준, 평가요소를 추출하여 정확한 띄어쓰기를 반영하여, JSON 형식으로 반환해주세요. 형식: { "영역": [영역들], "성취기준": [성취기준들], "평가요소": [평가요소들] }. Text: ${text}`
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

async function getApiKey(userId, teacherId) {
  let openaiApiKey = process.env.OPENAI_API_KEY;
  let useDefaultKey = false;

  // Firebase가 초기화되지 않은 경우 기본 키 사용
  if (!firebaseInitialized || !db) {
    console.warn('⚠️ Firebase 연결 실패: 기본 API 키 사용');
    if (!openaiApiKey) {
      throw new Error('Firebase 연결 실패 및 기본 API 키 없음');
    }
    return openaiApiKey;
  }

  try {
    // 관리자 설정 확인
    const adminDocRef = db.collection('users').doc('indend007@gmail.com');
    const adminDoc = await adminDocRef.get();
    const allowDefaultKey = adminDoc.exists && adminDoc.data().allowDefaultKey;
    
    console.log('🔑 관리자 키 사용 허용 상태:', allowDefaultKey);

    if (teacherId) {
      const teacherDocRef = db.collection('users').doc(teacherId.trim());
      const teacherDoc = await teacherDocRef.get();

      if (teacherDoc.exists) {
        const teacherData = teacherDoc.data();
        if (teacherData.openaiKey) {
          console.log('👩‍🏫 교사 개인 키 사용');
          openaiApiKey = teacherData.openaiKey;
        } else {
          console.log('🔄 기본 키 사용 시도');
          useDefaultKey = true;
        }
      }
    } else if (userId) {
      const userDocRef = db.collection('users').doc(userId.trim());
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.openaiKey) {
          console.log('👤 사용자 개인 키 사용');
          openaiApiKey = userData.openaiKey;
        } else {
          console.log('🔄 기본 키 사용 시도');
          useDefaultKey = true;
        }
      }
    }

    if (useDefaultKey && !allowDefaultKey) {
      console.error('❌ 기본 키 사용이 허용되지 않음');
      throw new Error('OpenAI API 키가 필요합니다. 프로필 설정에서 API 키를 입력해주세요.');
    }

    if (!openaiApiKey) {
      console.error('❌ API 키를 찾을 수 없음');
      throw new Error('API key not found');
    }

    console.log('✅ API 키 사용 준비 완료');
    return openaiApiKey;
  } catch (error) {
    console.error('Firebase 연결 중 오류:', error.message);
    
    // Firebase 오류 시 기본 키 사용
    if (openaiApiKey) {
      console.warn('⚠️ Firebase 오류로 기본 API 키 사용');
      return openaiApiKey;
    } else {
      throw new Error('Firebase 연결 실패 및 기본 API 키 없음');
    }
  }
}

async function extractTotalStudents(text, userId, teacherId) {
  try {
    const apiKey = await getApiKey(userId, teacherId);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts the total number of students from text. Always respond with valid JSON."
          },
          {
            role: "user",
            content: `
            학생이름은 {김,이,최,백,우,유,윤,박,노,강} 등의 단어로 시작하는 3글자 가량의 독립된 문자열이며, 텍스트에서 다음과 같이 번호(숫자)+빈칸+이름(문자열) 형태로 배열되어 있어. 
            1 이름, 2 이름, ...
            전학생의 경우 '전학생'이라고 입력이 되어 있으며, 전학생이라고 입력된 셀도 학생 수에 포함시켜줘.
            제공한 텍스트 중 학생 목록에서 학생 이름을 파악하여, 정확한 전체 학생 수를 추출하여 JSON 형식으로 반환해줘. 

            형식: { "총학생수": 숫자 }. Text: ${text}
            `
          }
        ],
        temperature: 0.5,
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

exports.handler = async function (event, context) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const contentType = event.headers['content-type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '잘못된 요청 형식입니다. multipart/form-data가 필요합니다.' }),
      };
    }

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
        headers,
        body: JSON.stringify({ error: 'PDF 파일이 업로드되지 않았습니다.' }),
      };
    }

    if (!userId && !teacherId) {
      console.error("User ID or Teacher ID not provided");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID 또는 Teacher ID가 제공되지 않았습니다.' }),
      };
    }

    console.log('📄 PDF 처리 시작...');
    
    // API 키 확인
    let openaiApiKey;
    try {
      openaiApiKey = await getApiKey(userId, teacherId);
    } catch (apiKeyError) {
      console.error('API 키 오류:', apiKeyError.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: apiKeyError.message }),
      };
    }

    // PDF 텍스트 추출
    let fullText;
    try {
      fullText = await extractTextFromPDF(pdfBuffer);
      console.log('✅ PDF 텍스트 추출 완료');
    } catch (pdfError) {
      console.error('PDF 추출 오류:', pdfError.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호화되어 있을 수 있습니다.' }),
      };
    }

    // 평가 기준 추출
    let evaluationCriteria;
    try {
      evaluationCriteria = await extractEvaluationCriteria(fullText, openaiApiKey);
      console.log('✅ 평가 기준 추출 완료');
    } catch (criteriaError) {
      console.error('평가 기준 추출 오류:', criteriaError.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '평가 기준을 추출할 수 없습니다. AI 서비스에 문제가 있거나 API 키를 확인해주세요.' }),
      };
    }

    // 총 학생 수 추출
    let totalStudents;
    try {
      totalStudents = await extractTotalStudents(fullText, userId, teacherId);
      console.log('✅ 총 학생 수 추출 완료:', totalStudents);
    } catch (studentsError) {
      console.error('학생 수 추출 오류:', studentsError.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '학생 수를 추출할 수 없습니다. PDF 형식을 확인해주세요.' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...evaluationCriteria,
        총학생수: totalStudents,
        fullText
      }),
    };

  } catch (error) {
    console.error("전체 처리 중 예상치 못한 오류:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: '서버에서 예상치 못한 오류가 발생했습니다.', 
        details: error.message 
      }),
    };
  }
};