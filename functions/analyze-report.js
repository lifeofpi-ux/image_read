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

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, rubric, userId, teacherId } = JSON.parse(event.body);

    let openaiApiKey = process.env.OPENAI_API_KEY; // 기본 환경변수에 설정된 키

    // teacherId가 있는 경우 해당 선생님의 OpenAI API 키를 가져옴
    if (teacherId) {
      const teacherDocRef = db.collection('users').doc(teacherId.trim());
      const teacherDoc = await teacherDocRef.get();

      if (teacherDoc.exists) {
        const teacherData = teacherDoc.data();
        if (teacherData.openaiKey) {
          openaiApiKey = teacherData.openaiKey;
        }
      } else {
        console.error('Teacher document not found:', teacherId);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Teacher not found', teacherId }),
        };
      }
    } else {
      // Firestore에서 사용자의 OpenAI API 키 가져오기
      const userDocRef = db.collection('users').doc(userId.trim());
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.openaiKey) {
          openaiApiKey = userData.openaiKey;
        }
      }
    }

    const systemPrompt = `당신은 학생 산출물을 평가하는 전문가입니다. 다음 루브릭을 기반으로 학생의 제출물을 평가해주세요:

루브릭 요약: ${rubric.summary}

평가 기준:
- 상: ${rubric.high}
- 중: ${rubric.mid}
- 하: ${rubric.low}

성취 기준: ${rubric.acnum}

평가 주제: ${rubric.rubric}

위의 루브릭을 사용하여 학생의 제출물을 평가하고, 구체적인 피드백을 제공해주세요.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        }
      }
    );

    const result = response.data.choices[0].message.content;
    const tokens = response.data.usage.total_tokens;

    console.log('Result:', result);
    console.log('Tokens Used:', tokens);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ result, tokens })
    };
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'An error occurred while analyzing the report' })
    };
  }
};
