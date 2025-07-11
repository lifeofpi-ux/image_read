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

async function getApiKey(userId, teacherId) {
  let openaiApiKey = process.env.OPENAI_API_KEY;
  let useDefaultKey = false;
  let isPersonalKey = false;

  // Firebase가 초기화되지 않은 경우 기본 키 사용
  if (!firebaseInitialized || !db) {
    console.warn('⚠️ Firebase 연결 실패: 기본 API 키 사용');
    if (!openaiApiKey) {
      throw new Error('Firebase 연결 실패 및 기본 API 키 없음');
    }
    return { apiKey: openaiApiKey, isPersonalKey: false };
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
          isPersonalKey = true;
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
          isPersonalKey = true;
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
    return { apiKey: openaiApiKey, isPersonalKey };
  } catch (error) {
    console.error('Firebase 연결 중 오류:', error.message);
    
    // Firebase 오류 시 기본 키 사용
    if (openaiApiKey) {
      console.warn('⚠️ Firebase 오류로 기본 API 키 사용');
      return { apiKey: openaiApiKey, isPersonalKey: false };
    } else {
      throw new Error('Firebase 연결 실패 및 기본 API 키 없음');
    }
  }
}

async function extractAndEvaluateStudent(text, studentIndex, evaluationCriteria, tone, apiKey, wordCount, creativity, isPersonalKey) {
  try {
    const evaluationAreas = evaluationCriteria.영역.map(area => `"${area}": "평가 결과"`).join(", ");
    
    let tonePrompt = '';
    if (tone === 'neisRecord') {
      tonePrompt = '보임. 씀. ~음. ~함. ~됨. 등의 자연스러운 형태로 문장이 끝나야 하며, 한국어 문장 구조에 맞는 자연스러운 문장을 작성해줘. 학생의 각 영역별 성취기준과 평가요소 문구를 적절히 학생의 평가 결과와 연관지어 평가 문장을 작성해야해. "우수를 받았음" 등과 같이 평가 결과 단어를 직접적으로 사용하면 안돼.';
    } else if (tone === 'growthFeedback') {
      tonePrompt = '학생에게 긍정과 성찰을 돕는 평가 문체로 작성해주며 각 영역별 성취기준과 평가요소 문구를 적절히 연관지어 문장을 작성해야 함.';
    }

    // 개인 키 사용 시 gpt-4.1, 기본 키 사용 시 gpt-4.1-mini
    const modelToUse = isPersonalKey ? "gpt-4.1" : "gpt-4.1-mini";
    console.log(`🤖 사용 모델: ${modelToUse} (개인키: ${isPersonalKey})`);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: `"역할:  학생들의 성취를 정확한 근거를 토대로 피드백하는 교사의 역할. 말투 지침: ${tonePrompt}, 평가결과 문장에서 학생 이름을 반드시 제외하고, 총 글자수는 ${wordCount}을 기준으로 설정하여, 함께 제시되는 #평가문장 예시와 같은 형태의 피드백을 제시해야 함. `
          },
          {
            role: "user",
            content: `
            #기본지침
            1. 전처리 : ${text}에서 "1:01:12임000000000000000000124717" 형태의 문자열은 TEXT 데이터에서 제거해줘.
            2.  Text: ${text}에서 학생 목록을 파악한뒤, ${studentIndex}번째 순서의 학생의 이름과 {평가점수}를 추출한 다음, 평가 기준: ${JSON.stringify(evaluationCriteria)}을 이해하고, 이에 따라 학생을 평가하는 자연스러운 문장을 생성해줘. 
              2-1. {평가점수}의 등급은 잘함,보통,노력요함이며, 각 상,중,하 등급, 혹은 최상, 상, 중, 하 등급은 다음과 같이 표기되는 것이 일반적이야. 순서대로 가장 앞에 나열된 것이 가장 우수한 성적, 뒤로 갈수록 낮은 성적이야.
              2-2. {잘함,보통,노력요함}, { ○ , □ , △ }, { ◎ , ○ , △ }, {상,중,하}, { ◎ , ○ , △ , □ }  

            3. 학생이름은 {김,이,최,백,우,유,윤,박,노,강} 등의 단어로 시작하는 3글자 가량의 독립된 문자열이며, 텍스트에서 다음과 같이 번호(숫자)+빈칸+이름(문자열) 형태로 배열되어 있어. 
              1 이름, 2 이름, ... 
            4. 이름처럼 보이는 문자열에 숫자가 포함이 되어 있다면, 그건 이름이 아니야. 정확한 이름을 추출하여 사용해줘. '전학생'문자열도 정확한 이름으로 간주해줘.
            5. 영역별 평가요소에 해당하는 문장을 기준으로 학생의 평가점수를 기준으로 학생의 수행 정도를 평가하는 구체적이고 자연스러운 문장으로 구성해줘. 
            6. 영역명을 직접 적지는 말아줘.
            7. 초등학생과 중학생 수준의 학생이니 너무 어려운 표현은 사용되지 않아야해. 
            8. 너무 짧은 문장들은 1~2문장을 적절하게 연결해서 자연스럽게 만들어줘.
            9. 평가 기준 성취기준과 평가요소 문장을 재구성하여, 최대한 자연스러운 표현으로 만들어줘. 
          
 
            #평가문장 기본 생성원칙
            ***평가 영역 점수가 '잘함'에 해당하는 경우 '뛰어남' 등과 같은 너무 강한 표현보다는 '우수함', '양호함', ' 잘 이해함', '능숙함' 등과 같은 무난한 표현을 사용해줘.
            ***평가 영역 점수가 '보통'인 경우 '같은 작품에 대한 생각이나 느낌이 서로 다를 수 있다는 것을 이해하고 자신의 생각이나 느낌을 다양한 방법으로 표현함.'와 같이 특별한 수식어 없이 일반적인 수행 능력에 대한 문장으로 표현해줘.     
            ***전반적으로 많은 영역의 점수가 낮은 학생의 경우, "부족함", "능력이 모자람" 등 부정적인 표현이 직접적으로 사용되지 않도록 해줘. 같은 의미를 가진 긍정표현을 사용해줘. 
            ***평가 기준 중 모든 평가 요소에 대한 문장을 만들 필요는 없어. 필요하다면 일부 문장은 생략해줘. 그리고 '영역에서는~' 등과 같은 표현은 사용하면 안돼. 
                       
            #평가문장 예시
            ***학급에서 예절 바른 친구의 말과 행동을 관찰한 후, 예절 바른 친구를 찾아 칭찬하는 활동에 즐겁게 참여함. 아름다운 삶의 사례를 살펴보고 생활 속에서 참된 아름다움을 실천하려는 마음을 다짐함.
            ***다양한 이야기를 통해 도덕적인 생활을 해야 하는 이유, 도덕 공부를 해야 하는 이유를 이해함. 예절의 중요성에 대해 알고, 대상과 상황에 따라 예절이 변화함을 이해하여 생활 속에서 꾸준히 실천함.
            ***몫이 한 자리 수인 두 자리 수 나누기 두 자리 수, 세 자리 수 나누기 두 자리 수의 계산 원리와 형식을 이해하고 정확히 몫을 구함. 막대그래프의 가로와 세로, 눈금 한 칸의 크기 등 기본 요소를 알고 잘 해석할 수 있음.
            ***생활 주변의 자연물이나 인공물의 탐색을 통해 다양한 조형 요소를 찾아보고 그 특징을 이해한 후, 조형 요소의 특징이 잘 나타나도록 주제를 표현함. 미술 작가와 작품의 특징을 조사하고, 좋아하는 미술 작가와 작품을 친구들에게 소개함.
            ***감정이나 상태를 묻고 답하는 말을 할 수 있으며, 누구인지 묻고 답하는 말을 듣고 이해함. 운동에 관한 구를 읽고 뜻을 이해할 수 있으며, 물건을 나타내는 낱말을 쓸 수 있음.
            ***지도의 기호, 축척, 등고선 등을 이해하여 지도에 나타난 지리 정보를 읽을 수 있음. 우리 지역의 문화유산을 조사하여 다양한 정보를 수집하고 소중히 보존해야 함을 인식함.
            ***다양한 상황과 대상에 따른 언어적 비언어적 표현의 효과에 대해 알고 실제 생활에 적용함. 글을 읽으면서 낱말의 뜻을 짐작해 보고 짐작한 뜻을 사전에서 찾아 확인함.

            #최종 결과물 산출: 최종적으로 평가결과 문장에서 이름 및 주어를 제외한, 순수한 평가결과를 JSON 형식으로 반환해줘. 
            
            **중요**: "평가점수" 필드에는 반드시 간단한 등급만 입력해줘. 예시: "우수", "보통", "노력요함", "상", "중", "하" 등
            상세한 평가 내용은 "평가결과" 필드에만 작성해줘.
            
            형식: { "학생데이터": { "번호": "1", "이름": "홍길동" , "평가점수": { ${evaluationAreas} } }, "평가결과": "..." }. 
            
            평가점수 예시:
            { "쓰기": "보통", "문법": "노력요함", "듣기·말하기": "우수" }
            `
          }
        ],
        temperature: creativity,
        max_tokens: 4000
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

    const { apiKey, isPersonalKey } = await getApiKey(userId, teacherId);

    const studentDataAndEvaluation = await extractAndEvaluateStudent(
      fullText,
      studentIndex,
      evaluationCriteria,
      tone,
      apiKey,
      wordCount,
      creativity,
      isPersonalKey
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