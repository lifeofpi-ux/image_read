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

async function extractAndEvaluateStudent(text, studentIndex, evaluationCriteria, tone, apiKey) {
  try {
    const evaluationAreas = evaluationCriteria.영역.map(area => `"${area}": "평가 결과"`).join(", ");
    
    let tonePrompt = '';
    if (tone === 'neisRecord') {
      tonePrompt = '보임. 씀. ~음. ~함. ~됨. 등의 자연스러운 형태로 문장이 끝나야 하며 현재 시제로 간결하게 문장을 작성해줘. 학생의 각 영역별 성취기준과 평가요소 문구를 적절히 학생의 평가 결과와 연관지어 평가 문장을 작성함. "우수를 받았음" 등과 같이 평가 결과 단어를 직접적으로 사용하면 안됨.';
    } else if (tone === 'growthFeedback') {
      tonePrompt = '학생에게 긍정과 성찰을 돕는 격식있지만 따뜻하고 편안한 문체로 작성해주며 각 영역별 성취기준과 평가요소 문구를 적절히 연관지어 현재 시제로 문장을 작성해야 합니다.';
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `"학생들의 성취를 정확한 근거를 토대로 피드백하는 교사의 역할. 말투 지침: ${tonePrompt} 평가결과 문장은 학생 이름을 반드시 제외하고 250글자 정도의 피드백만 제시해야 함. `
          },
          {
            role: "user",
            content: `Text: ${text}에서 ${studentIndex}번 학생의 번호, 이름, 평가점수(잘함,보통,노력요함 혹은 상,중,하)를 추출하고, 평가 기준: ${JSON.stringify(evaluationCriteria)}에 따라 학생을 평가하는 자연스러운 문장을 생성해줘. 
            영역별 평가요소에 해당하는 문장을 조합하여 학습 결과를 성찰하는 구체적인 문장으로 구성해줘. 
            영역명을 직접 적지는 말아줘. 
            필요하다면 학생의 부족한 부분을 보완하고 잘하는 부분은 칭찬하는 긍정적인 성찰의 내용도 한문장 정도 함께 반영해줘. 
            초등학생과 중학생 수준의 학생이니 너무 어려운 표현은 사용되지 않아야해. 
            너무 짧은 문장은 적절하게 연결해서 자연스럽게 만들어줘.
            최종적으로 평가결과 문장에서 이름 및 주어를 제외한, 순수한 평가결과를 JSON 형식으로 반환해줘. 
            형식: { "학생데이터": { "번호": "1", "이름": "홍길동" , "평가점수": { ${evaluationAreas} } }, "평가결과": "..." }. 
            `
          }
        ],
        temperature: 0.4,
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
    const { evaluationCriteria, studentIndex, fullText, tone } = JSON.parse(event.body);

    if (!evaluationCriteria || studentIndex === undefined || !fullText || !tone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '잘못된 요청 데이터입니다.' }),
      };
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;

    const studentDataAndEvaluation = await extractAndEvaluateStudent(fullText, studentIndex, evaluationCriteria, tone, openaiApiKey);

    return {
        statusCode: 200,
        body: JSON.stringify(studentDataAndEvaluation),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '처리 중 오류가 발생했습니다.', details: error.message }),
    };
  }
};