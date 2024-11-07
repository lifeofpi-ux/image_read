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

    // 기존 API 키 호출 부분을 새로운 getApiKey 함수로 교체
    const openaiApiKey = await getApiKey(userId, teacherId);

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
        max_tokens: 1000
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
      body: JSON.stringify({ error: '이미지 분석 중 오류가 발생했습니다.', details: error.message }),
    };
  }
};
