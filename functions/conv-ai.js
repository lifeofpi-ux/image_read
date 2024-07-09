const axios = require('axios');
const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config();

// Initialize Firebase Admin SDK
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
    const { message, history, userId, teacherId, currentPrompt } = JSON.parse(event.body);
    console.log('Received request:', { message, history, userId, teacherId, currentPrompt });

    let openaiApiKey = process.env.OPENAI_API_KEY;

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
    } else if (userId) {
      const userDocRef = db.collection('users').doc(userId.trim());
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.openaiKey) {
          openaiApiKey = userData.openaiKey;
        }
      }
    }

    // 새로운 사용자 메시지 추가
    history.push({ role: 'user', content: message });

    console.log('Sending request to OpenAI:', { model: 'gpt-4o', messages: history });

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: history,
        max_tokens: 1000
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
    console.error('Error in handler:', error);
    console.error('Error response:', error.response ? error.response.data : 'No response data');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: `An error occurred: ${error.message}` })
    };
  }
};
