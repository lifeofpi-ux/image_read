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

async function extractAndEvaluateStudent(text, studentIndex, evaluationCriteria, tone, apiKey, wordCount, creativity) {
  try {
    // 학생 목록을 추출하는 프롬프트 추가
    const studentListResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "학생들의 번호와 이름을 순서대로 추출하는 assistant입니다."
          },
          {
            role: "user",
            content: `텍스트에서 모든 학생들의 번호와 이름을 순서대로 추출해주세요. 형식: { "students": [{"번호": "1", "이름": "홍길동"}, ...] }. Text: ${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const studentListContent = studentListResponse.data.choices[0].message.content;
    const studentList = JSON.parse(studentListContent);
    
    // 현재 평가할 학생 찾기
    const currentStudent = studentList.students.find(s => s.번호 === studentIndex.toString());
    
    if (!currentStudent) {
      throw new Error(`${studentIndex}번 학생을 찾을 수 없습니다.`);
    }

    // 기존 평가 프롬프트 유지하면서 학생 정보 추가
    const evaluationAreas = evaluationCriteria.영역.map(area => `"${area}": "평가 결과"`).join(", ");
    
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
            1. Text: ${text}에서 학생의 번호 ${studentIndex}(${currentStudent.이름}), 평가점수(잘함,보통,노력요함 혹은 상,중,하)를 추출하고, 평가 기준: ${JSON.stringify(evaluationCriteria)}을 이해하고, 이에 따라 학생을 평가하는 자연스러운 문장을 생성해줘. 
            2. 영역별 평가요소에 해당하는 문장을 기준으로 학생의 평가점수를 기준으로 학생의 수행 정도를 평가하는 구체적이고 자연스러운 문장으로 구성해줘. 
            3. 학생 번호는 1번부터 시작하며, 번호가 없는 경우 존재하지 않는 학생이므로, 없는 번호가 존재하면 다음 번호의 학생을 바로 평가해줘. 
            4. 영역명을 직접 적지는 말아줘.
            5. 초등학생과 중학생 수준의 학생이니 너무 어려운 표현은 사용되지 않아야해. 
            6. 너무 짧은 문장들은 1~2문장을 적절하게 연결해서 자연스럽게 만들어줘.
            7. 평가 기준 성취기준과 평가요소 문장을 재구성하여, 최대한 자연스러운 표현으로 만들어줘. 
           
            #평가문장 기본 생성원칙
            ***모든 영역에서 '우수'를 받은 학생의 경우, '~ 우수함., ~ 돋보임., ~ 잘 설명함.' 등의 표현을 무작위로 피드백 문장에 섞어서 학생이 잘하는 부분을 칭찬하는 긍정적인 성찰의 내용도 한문장 정도 함께 반영해줘. 모든 영역이 우수하더라도 추가적인 피드백 문장이 없을 수도 있어. 랜덤하게 추가해줘. 
            ***평가 영역 점수가 '보통'인 경우 '같은 작품에 대한 생각이나 느낌이 서로 다를 수 있다는 것을 이해하고 자신의 생각이나 느낌을 다양한 방법으로 표현함.'와 같이 특별한 수식어 없이 일반적인 수행 능력에 대한 문장으로 표현해줘.     
            ***전반적으로 많은 영역의 점수가 낮은 학생의 경우, 부족한 부분에 대한 내용을 보충하여 (~한다면, 더 나은 발전이 있을 것으로 기대됨.) 등과 같은 앞으로의 발전을 위한 피드백 문장을 추가해줘. 
            ***평가 기준 중 모든 평가 요소에 대한 문장을 만들 필요는 없어. 필요하다면 일부 문장은 생략해줘.`
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
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    
    return {
      ...JSON.parse(jsonString),
      평가된_학생_목록: studentList.students
    };
  } catch (error) {
    throw new Error(`${studentIndex}번 학생 데이터 추출 및 평가 중 오류가 발생했습니다: ${error.message}`);
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
      teacherId
    } = JSON.parse(event.body);

    if (!evaluationCriteria || studentIndex === undefined || !fullText || !tone || !wordCount || creativity === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '잘못된 요청 데이터입니다.' }),
      };
    }

    const openaiApiKey = await getApiKey(userId, teacherId);

    const studentDataAndEvaluation = await extractAndEvaluateStudent(
      fullText,
      studentIndex,
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '처리 중 오류가 발생했습니다. API KEY나 파일을 점검해주세요.', details: error.message }),
    };
  }
};