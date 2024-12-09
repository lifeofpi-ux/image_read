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
  const adminDocRef = db.collection('users').doc(process.env.ADMIN_EMAIL);
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
    const evaluationAreas = evaluationCriteria.영역.map(area => `"${area}": "평가 결과"`).join(", ");
    
    let tonePrompt = '';
    if (tone === 'neisRecord') {
      tonePrompt = '보임. 씀. ~음. ~함. ~됨. 등의 자연스러운 형태로 문장이 끝나야 하며 현재 시제로 간결하게 문장을 작성해줘. 학생의 각 영역별 성취기준과 평가요소 문구를 적절히 학생의 평가 결과와 연관지어 평가 문장을 작성함. "우수를 받았음" 등과 같이 평가 결과 단어를 직접적으로 사용하면 안됨.';
    } else if (tone === 'growthFeedback') {
      tonePrompt = '학생에게 긍정과 성찰을 돕는 평가 문체로 작성해주며 각 영역별 성취기준과 평가요소 문구를 적절히 연관지어 문장을 작성해야 함.';
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `"학생들의 성취를 정확한 근거를 토대로 피드백하는 교사의 역할. 말투 지침: ${tonePrompt} 평가결과 문장은 학생 이름을 반드시 제외하고, 분량은 ${wordCount} 값을 확인하여 해당 값에 해당하는 글자 숫자를 반영한 피드백을 제시해야 함. `
          },
          {
            role: "user",
            content: `Text: ${text}에서 ${studentIndex}번 학생의 번호, 이름, 평가점수(잘함,보통,노력요함 혹은 상,중,하)를 추출하고, 평가 기준: ${JSON.stringify(evaluationCriteria)}에 따라 학생을 평가하는 자연스러운 문장을 생성해줘. 
            영역별 평가요소에 해당하는 문장을 조합하여 학습 결과를 성찰하고 평가하는 구체적이고 자연스러운 문장으로 구성해줘. 
            영역명을 직접 적지는 말아줘. 
            우수한 학생의 경우, 잘하는 부분을 칭찬하는 긍정적인 성찰의 내용도 한문장 정도 함께 반영해줘. 모든 평가 요소에 대한 문장을 만들 필요는 없어. 
            초등학생과 중학생 수준의 학생이니 너무 어려운 표현은 사용되지 않아야해. 
            너무 짧은 문장들은 1~2문장을 적절하게 연결해서 자연스럽게 만들어줘.
            다음은 예시 문장들의 형태야. 다음 문장들의 형태로 최종 결과를 출력해줘.  
            {[같은 작품에 대한 생각이나 느낌이 서로 다를 수 있다는 것을 이해하고 자신의 생각이나 느낌을 다양한 방법으로 표현함. 국어사전에서 낱말을 찾는 방법을 알고 낱말의 뜻을 찾음.],
            [각도기를 사용하여 각의 크기를 재는 방법을 이해하고 주어진 각을 정확하게 측정할 수 있음. 곱하는 수가 한 자리 수 또는 두 자리 수인 곱셈의 계산 원리를 이해하고 계산할 수 있음.],
            [평면도형의 이동을 활용하여 다양한 무늬를 창의적으로 만들고 무늬를 만든 방법을 설명할 수 있음. 막대그래프의 세로 눈금을 달리하거나 가로와 세로를 바꾸어 다른 형태로 막대그래프를 그릴 수 있음.],
            [생활 주변의 자연물이나 인공물의 탐색을 통해 다양한 조형 요소를 찾아보고 그 특징을 이해한 후, 조형 요소의 특징이 잘 나타나도록 주제를 표현함. 미술 작가와 작품의 특징을 조사하고, 좋아하는 미술 작가와 작품을 친구들에게 소개함.]}
            최종적으로 평가결과 문장에서 이름 및 주어를 제외한, 순수한 평가결과를 JSON 형식으로 반환해줘. 
            형식: { "학생데이터": { "번호": "1", "이름": "홍길동" , "평가점수": { ${evaluationAreas} } }, "평가결과": "..." }. 
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
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonString = content.substring(jsonStart, jsonEnd);
    
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`${studentIndex}번 학생 데이터 추출 및 평가 중 오류가 발생했습니다: ${error.message}`);
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { evaluationCriteria, studentIndex, fullText, tone, wordCount, creativity } = JSON.parse(event.body);

    if (!evaluationCriteria || studentIndex === undefined || !fullText || !tone || !wordCount || creativity === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '잘못된 요청 데이터입니다.' }),
      };
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;

    const studentDataAndEvaluation = await extractAndEvaluateStudent(fullText, studentIndex, evaluationCriteria, tone, openaiApiKey, wordCount, creativity);

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