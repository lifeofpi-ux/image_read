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

// 대화 내역 저장 함수 추가
async function saveConversation(userId, teacherId, studentId, studentName, messages, totalTokens) {
  try {
    // 현재 시간 기준으로 대화 ID 생성
    const conversationId = `conv_${Date.now()}`;
    
    // 로깅 추가: 학생 정보 확인
    console.log('📝 Saving conversation with info:', {
      userId,
      teacherId,
      studentId: studentId || 'not provided',
      studentName: studentName || 'not provided',
      messagesCount: messages.length,
      totalTokens
    });
    
    // 프롬프트 및 지시사항 필터링 (system 메시지 및 특정 키워드 포함된 메시지 제외)
    const filteredMessages = messages.filter(msg => {
      // 시스템 메시지는 제외
      if (msg.role === 'system') {
        return false;
      }
      
      // 비어 있거나 역할이 없는 메시지 제외
      if (!msg || !msg.role || !msg.content) {
        return false;
      }
      
      // AI의 지시사항 메시지 제외 (특정 키워드 포함)
      if (msg.role === 'assistant' && 
         (msg.content.includes('가이드해줘') || 
          msg.content.includes('피드백해줘') ||
          msg.content.includes('##AI_INSTRUCTION##'))) {
        return false;
      }
      
      return true;
    });
    
    console.log(`메시지 필터링: 원본 ${messages.length}개 → 필터링 후 ${filteredMessages.length}개`);
    
    // 필터링된 메시지가 없는 경우 저장하지 않음
    if (filteredMessages.length === 0) {
      console.log('⚠️ 필터링 후 저장할 메시지가 없습니다. 저장을 건너뜁니다.');
      return null;
    }
    
    const conversationData = {
      userId: userId, // 대화 주체 ID (학생 또는 교사)
      teacherId: teacherId, // 학생인 경우 담당 교사 ID
      studentId: studentId || null, // 학생 ID (학생인 경우만)
      studentName: studentName || null, // 학생 이름 (학생인 경우만)
      messages: filteredMessages, // 필터링된 대화 내역
      totalTokens: totalTokens, // 토큰 사용량
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // 저장 시간
      lastMessage: filteredMessages[filteredMessages.length - 1].content.substring(0, 100) // 마지막 메시지 미리보기
    };
    
    // Firestore에 대화 내역 저장
    await db.collection('conversations').doc(conversationId).set(conversationData);
    console.log('✅ 대화 내역 저장 완료:', conversationId);
    
    return conversationId;
  } catch (error) {
    console.error('❌ 대화 내역 저장 오류:', error);
    return null;
  }
}

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

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message, history, userId, teacherId, currentPrompt, studentId, studentName } = JSON.parse(event.body);
    console.log('Received request:', { message, history, userId, teacherId, currentPrompt, studentId, studentName });

    // 학생/교사 정보 확인
    const isStudent = !!teacherId && !!studentId;
    console.log(`🧑‍🎓 Request from ${isStudent ? 'student' : 'teacher'}`);
    
    if (isStudent) {
      console.log(`학생 정보: ${studentName || '이름 없음'} (ID: ${studentId})`);
      console.log(`교사 정보: ID=${teacherId}`);
    }

    let openaiApiKey = await getApiKey(userId, teacherId);

    // 프롬프트 지시사항과 학생 메시지 구분을 위한 처리
    let processedHistory = [...history];
    
    // 시스템 프롬프트 있는지 확인
    const hasSystemPrompt = processedHistory.some(msg => msg.role === 'system');
    
    // 현재 프롬프트 정보가 있고 시스템 메시지가 없는 경우 추가
    if (!hasSystemPrompt && currentPrompt) {
      const systemMessage = {
        role: 'system',
        content: currentPrompt.baseRole
      };
      processedHistory.unshift(systemMessage);
      
      // AI 지시사항이 있으면 마킹 추가
      if (currentPrompt.aiPrompt) {
        const instructionMessage = {
          role: 'assistant',
          content: `##AI_INSTRUCTION## ${currentPrompt.aiPrompt}`
        };
        processedHistory.push(instructionMessage);
      }
    }
    
    // 새로운 사용자 메시지 추가
    processedHistory.push({ role: 'user', content: message });

    console.log('Sending request to OpenAI:', { model: 'gpt-4o', messages: processedHistory });

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: processedHistory,
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

    // 메시지에 AI 응답 추가
    const updatedHistory = [...processedHistory, { role: 'assistant', content: result }];
    
    // 대화 내역 저장 (학생인 경우 학생 정보 포함)
    await saveConversation(
      userId, 
      teacherId || userId, 
      studentId, 
      studentName,
      updatedHistory,
      tokens
    );

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
