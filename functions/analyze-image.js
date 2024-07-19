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

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 요청 본문 파싱
    const { image, prompt, userId, teacherId } = JSON.parse(event.body);

    // userId 및 teacherId 유효성 검사
    if ((!userId || typeof userId !== 'string' || userId.trim() === '') &&
        (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '')) {
      console.error('Invalid or missing userId and teacherId:', userId, teacherId);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid or missing userId and teacherId', userId: userId || null, teacherId: teacherId || null }),
      };
    }

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

    // OpenAI API 요청
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    const result = response.data.choices[0].message.content;
    const tokens = response.data.usage.total_tokens;

    console.log('Result:', result);
    console.log('Tokens Used:', tokens);

    return {
      statusCode: 200,
      body: JSON.stringify({ result, tokens }),
    };
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '이미지 분석 중 오류가 발생했습니다.' }),
    };
  }
};
