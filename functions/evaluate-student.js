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

async function getApiKey(userId, teacherId) {
  let openaiApiKey = process.env.OPENAI_API_KEY;
  let useDefaultKey = false;

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
}

async function extractAndEvaluateStudent(text, student, evaluationCriteria, tone, apiKey, wordCount, creativity) {
  try {
    // evaluationAreas 매핑 방식 수정
    console.log('Evaluation Criteria:', evaluationCriteria); // 디버깅용 로그

    // 평가 영역 매핑 검증
    if (!evaluationCriteria || !evaluationCriteria.영역 || !Array.isArray(evaluationCriteria.영역)) {
      console.error('Invalid evaluationCriteria:', evaluationCriteria);
      throw new Error('평가 기준 데이터가 올바르지 않습니다.');
    }

    const evaluationAreas = evaluationCriteria.영역
      .map((area, index) => {
        // 각 영역에 대한 평가 결과 초기화
        return `"${area}": "평가중"`;
      })
      .join(", ");

    console.log('Mapped evaluation areas:', evaluationAreas); // 디버깅용 로그

    let tonePrompt = '';
    if (tone === 'neisRecord') {
      tonePrompt = '보임. 씀. ~음. ~함. ~됨. 등의 자연스러운 형태로 문장이 끝나야 하며, 한국어 문장 구조에 맞는 자연스러운 문장을 작성해줘. 학생의 각 영역별 성취기준과 평가요소 문구를 적절히 학생의 평가 결과와 연관지어 평가 문장을 작성해야해. "우수를 받았음" 등과 같이 평가 결과 단어를 직접적으로 사용하면 안돼.';
    } else if (tone === 'growthFeedback') {
      tonePrompt = '학생에게 긍정과 성찰을 돕는 평가 문체로 작성해주며 각 영역별 성취기준과 평가요소 문구를 적절히 연관지어 문장을 작성해야 함.';
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `"역할: 학생들의 성취를 정확한 근거를 토대로 피드백하는 교사의 역할. 말투 지침: ${tonePrompt}, 평가결과 문장에서 학생 이름을 반드시 제외하고, 총 글자수는 ${wordCount}을 기준으로 설정하여, 피드백을 제시해야 함. `
          },
          {
            role: "user",
            content: `
            #기본지침
            1. Text: ${text}에서 ${student.번호} ${student.이름} 학생의 평가점수를 추출하고, 평가 기준: ${JSON.stringify(evaluationCriteria)}을 이해하고, 이에 따라 학생을 평가하는 자연스러운 문장을 생성해줘. 
            2. 영역별 평가요소에 해당하는 문장을 기준으로 학생의 평가점수를 기준으로 학생의 수행 정도를 평가하는 구체적이고 자연스러운 문장으로 구성해줘. 
            3. 영역명을 직접 적지는 말아줘.
            4. 초등학생과 중학생 수준의 학생이니 너무 어려운 표현은 사용되지 않아야해. 
            5. 너무 짧은 문장들은 1~2문장을 적절하게 연결해서 자연스럽게 만들어줘.
            6. 평가 기준 성취기준과 평가요소 문장을 재구성하여, 최대한 자연스러운 표현으로 만들어줘. 

            #최종 결과물 산출: 최종적으로 평가결과 문장에서 이름 및 주어를 제외한, 순수한 평가결과를 JSON 형식으로 반환해줘. 
            형식: { "학생데이터": { "번호": "${student.번호}", "이름": "${student.이름}" , "평가점수": { ${evaluationAreas} } }, "평가결과": "..." }. 
            `
          }
        ],
        temperature: creativity,
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
    console.log('API Response content:', content); // 디버깅용 로그

    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    
    const result = JSON.parse(jsonString);
    console.log('Parsed result:', result); // 디버깅용 로그
    
    return result;
  } catch (error) {
    console.error('Error in extractAndEvaluateStudent:', error);
    throw new Error(`${student.번호}번 학생 데이터 추출 및 평가 중 오류가 발생했습니다: ${error.message}`);
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { 
      evaluationCriteria, 
      studentIndex, 
      fullText, 
      tone, 
      wordCount, 
      creativity,
      userId,
      teacherId,
      학생목록
    } = JSON.parse(event.body);

    // 요청 데이터 로깅
    console.log('Received request data:', {
      studentIndex,
      학생목록: 학생목록?.length,
      userId,
      teacherId
    });

    // 기본 데이터 검증
    if (!evaluationCriteria || !fullText || !tone || !wordCount || !creativity || !학생목록) {
      console.error('Missing required data:', { 
        evaluationCriteria: !!evaluationCriteria,
        fullText: !!fullText,
        tone: !!tone,
        wordCount: !!wordCount,
        creativity: !!creativity,
        학생목록: !!학생목록
      });
      throw new Error('필수 데이터가 누락되었습니다.');
    }

    // 학생 정보 검증
    const currentStudent = 학생목록.find(student => student.번호 === String(studentIndex));
    console.log('Found student:', currentStudent);
    
    if (!currentStudent) {
      console.error(`Student not found: index ${studentIndex}`);
      throw new Error(`${studentIndex}번 학생을 찾을 수 없습니다.`);
    }

    const openaiApiKey = await getApiKey(userId, teacherId);

    const studentDataAndEvaluation = await extractAndEvaluateStudent(
      fullText,
      currentStudent,
      evaluationCriteria,
      tone,
      openaiApiKey,
      wordCount,
      creativity
    );

    return {
      statusCode: 200,
      body: JSON.stringify(studentDataAndEvaluation),
    };
  } catch (error) {
    console.error('Error in handler:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: '처리 중 오류가 발생했습니다.', 
        details: error.message,
        stack: error.stack
      }),
    };
  }
};