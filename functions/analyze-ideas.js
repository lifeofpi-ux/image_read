const axios = require('axios');
const admin = require('firebase-admin');
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
    const { posts, message, userId, teacherId } = JSON.parse(event.body);

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

    const postJson = JSON.stringify(posts, null, 2);

    const systemPrompt = `귀하는 학생 아이디어를 평가하는 전문가입니다.
    다음 제공되는 데이터와 사용자의 메시지에 따라 간결하고 빠르게 대답하세요. :

User Message: ${message}

Student Ideas: ${postJson}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 2000,
        temperature: 0.8
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        }
      }
    );

    const result = response.data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ evaluation: result })
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
      body: JSON.stringify({ error: '아이디어 분석 중 오류가 발생했습니다.' })
    };
  }
};
