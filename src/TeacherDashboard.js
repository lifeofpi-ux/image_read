import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';
import './App.css';
import './custom.css';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationList, setShowConversationList] = useState(true);
  
  // 실제 대화 메시지만 필터링하는 함수 (시스템 프롬프트나 지시사항 제외)
  const getActualConversation = useCallback((messages) => {
    if (!messages || !Array.isArray(messages)) return [];
    
    // 필터링 조건
    const filtered = messages.filter(msg => {
      // 빈 메시지 또는 역할이 없는 메시지 제외
      if (!msg || !msg.role || !msg.content) return false;
      
      // 시스템 메시지 제외
      if (msg.role === 'system') return false;
      
      // 지시사항 메시지 제외
      if (msg.role === 'assistant' && (
        msg.content.includes('##AI_INSTRUCTION##') ||
        msg.content.includes('가이드해줘') || 
        msg.content.includes('피드백해줘'))
      ) {
        return false;
      }
      
      return true;
    });
    
    return filtered;
  }, []);
  
  // 대화에서 마지막 사용자-AI 메시지 쌍 찾기
  const getLastUserAIExchange = useCallback((messages) => {
    const actualMessages = getActualConversation(messages);
    if (actualMessages.length === 0) return '대화 내용 없음';
    
    // 마지막 AI 메시지 찾기
    for (let i = actualMessages.length - 1; i >= 0; i--) {
      if (actualMessages[i].role === 'assistant') {
        return actualMessages[i].content.substring(0, 100) + (actualMessages[i].content.length > 100 ? '...' : '');
      }
    }
    
    // AI 메시지를 찾지 못했을 경우 가장 최근 메시지 반환
    return actualMessages[actualMessages.length - 1].content.substring(0, 100) + 
           (actualMessages[actualMessages.length - 1].content.length > 100 ? '...' : '');
  }, [getActualConversation]);
  
  // 중복 메시지 제거 및 순서 정렬
  const processChatMessages = useCallback((messages) => {
    if (!messages || !Array.isArray(messages)) return [];
    
    // 실제 대화 메시지만 필터링
    const filteredMessages = getActualConversation(messages);
    
    // 중복 메시지 제거 (동일한 내용 + 역할의 메시지)
    const uniqueMessages = [];
    const seen = new Set();
    
    filteredMessages.forEach(msg => {
      // 메시지 식별자 생성 (역할 + 내용 첫 50자)
      const msgKey = `${msg.role}:${msg.content.substring(0, 50)}`;
      if (!seen.has(msgKey)) {
        seen.add(msgKey);
        uniqueMessages.push(msg);
      }
    });
    
    return uniqueMessages;
  }, [getActualConversation]);
  
  useEffect(() => {
    const fetchStudentsAndConversations = async () => {
      try {
        setIsLoading(true);
        
        const user = auth.currentUser;
        if (!user) {
          console.error("No authenticated user found");
          setIsLoading(false);
          return;
        }
        
        console.log('Fetching conversations for teacher ID:', user.uid);
        
        // 모든 대화를 가져오고 클라이언트에서 필터링
        const q = query(
          collection(db, "conversations"),
          orderBy("timestamp", "desc"),
          limit(200)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Total conversations found:', querySnapshot.size);
        
        const allConversations = [];
        const studentMap = new Map();
        
        // 교사의 대화만 필터링하고 학생별로 가장 최근 대화만 유지
        const latestConversations = new Map();
        
        querySnapshot.forEach((doc) => {
          const convData = doc.data();
          
          // 현재 로그인된 교사의 대화만 필터링
          if (convData.teacherId === user.uid && convData.studentId) {
            const studentId = convData.studentId;
            const timestamp = convData.timestamp?.toDate() || new Date();
            
            // 학생 정보 저장
            if (convData.studentName) {
              studentMap.set(studentId, convData.studentName);
            }
            
            // 해당 학생의 최신 대화 업데이트
            if (!latestConversations.has(studentId) || 
                timestamp > latestConversations.get(studentId).timestamp) {
              
              // 메시지 처리
              const processedMessages = processChatMessages(convData.messages);
              const lastMessage = getLastUserAIExchange(convData.messages);
              
              const enhancedConvData = {
                ...convData,
                id: doc.id,
                displayMessages: processedMessages,
                displayLastMessage: lastMessage,
                timestamp: timestamp
              };
              
              latestConversations.set(studentId, enhancedConvData);
            }
          }
        });
        
        // Map에서 배열로 변환
        allConversations.push(...latestConversations.values());
        
        // 최신순으로 정렬
        allConversations.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log('Processed conversations:', allConversations.length);
        setConversations(allConversations);
        setStudents(Array.from(studentMap).map(([id, name]) => ({ id, name })));
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        console.error("Error details:", error.code, error.message);
        setIsLoading(false);
      }
    };
    
    fetchStudentsAndConversations();
  }, [processChatMessages, getLastUserAIExchange]);
  
  // 학생 필터링
  const filteredConversations = selectedStudent 
    ? conversations.filter(conv => conv.studentId === selectedStudent)
    : conversations;
  
  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setShowConversationList(false);
    
    // 콘솔에 대화 정보 출력
    console.log('👁️ Selected conversation:', {
      id: conversation.id,
      studentName: conversation.studentName,
      messagesCount: conversation.displayMessages?.length || 0
    });
  };
  
  const handleBackToList = () => {
    setShowConversationList(true);
  };
  
  return (
    <div className="teacher-dashboard">
      <h1>👨‍🏫 AI 채팅 대화 내역 대시보드</h1>
      
      <div className="dashboard-layout">
        <div className="sidebar">
          <div className="filter-section">
            <h3>학생 필터</h3>
            <select 
              value={selectedStudent || ''} 
              onChange={(e) => setSelectedStudent(e.target.value || null)}
              className="student-select"
            >
              <option value="">모든 학생</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="main-content">
          {showConversationList ? (
            <div className="conversation-list">
              <h3>학생 대화 목록</h3>
              {isLoading ? (
                <p>대화 내역을 불러오는 중...</p>
              ) : filteredConversations.length === 0 ? (
                <p>저장된 대화가 없습니다.</p>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="conversation-item"
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="conversation-header">
                      <strong>{conversation.studentName || '이름 없음'}</strong>
                      <span className="conversation-time">
                        {conversation.timestamp ? new Date(conversation.timestamp).toLocaleString('ko-KR') : '날짜 없음'}
                      </span>
                    </div>
                    <div className="conversation-preview">
                      <span>{conversation.displayLastMessage || '내용 없음'}</span>
                      <span className="message-count">{conversation.displayMessages?.length || 0}개 메시지</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="conversation-view">
              <div className="conversation-view-header">
                <button className="back-button" onClick={handleBackToList}>
                  ← 목록으로 돌아가기
                </button>
                <h3>{selectedConversation?.studentName || '이름 없음'}님과의 대화</h3>
                <div className="conversation-meta">
                  <span className="timestamp">
                    {selectedConversation?.timestamp ? new Date(selectedConversation.timestamp).toLocaleString('ko-KR') : '날짜 없음'}
                  </span>
                  <span className="message-count">메시지 수: {selectedConversation?.displayMessages?.length || 0}개</span>
                  <span className="tokens">사용 토큰: {selectedConversation?.totalTokens || 0}</span>
                </div>
              </div>
              
              <div className="message-list">
                {selectedConversation?.displayMessages && selectedConversation.displayMessages.length > 0 ? (
                  selectedConversation.displayMessages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                      <div className="message-role">
                        {message.role === 'user' ? '학생' : '챗봇'}:
                      </div>
                      <div className="message-content">{message.content}</div>
                    </div>
                  ))
                ) : (
                  <p>대화 내용이 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>통계</h3>
          <p>등록된 학생: {students.length}명</p>
          <p>학생별 대화 세션: {conversations.length}개</p>
        </div>
        <div className="stat-card">
          <h3>최근 활동</h3>
          <p>
            {conversations.length > 0
              ? `마지막 대화: ${
                  new Date(conversations[0].timestamp).toLocaleString('ko-KR')
                }`
              : '최근 활동 없음'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard; 