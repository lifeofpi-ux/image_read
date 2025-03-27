import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './DashboardPanel.css';

const DashboardPanel = ({ isOpen, onClose, dashboardType = 'chat' }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // 학생 필터링
  const filteredConversations = selectedStudent 
    ? conversations.filter(conv => conv.studentId === selectedStudent)
    : conversations;
  
  // 실제 대화 메시지만 필터링하는 함수 (시스템 프롬프트나 지시사항 제외)
  const getActualConversation = useCallback((messages) => {
    if (!messages || !Array.isArray(messages)) {
      console.log('getActualConversation: 메시지가 없거나 배열이 아님');
      return [];
    }
    
    // 필터링 기준 강화
    const filtered = messages.filter(msg => {
      // 빈 메시지 또는 역할이 없는 메시지 제외
      if (!msg || !msg.role || !msg.content) return false;
      
      // 시스템 메시지 제외
      if (msg.role === 'system') return false;
      
      // 지시사항 메시지 제외 (특수 문자열 또는 특정 키워드 포함)
      if (msg.role === 'assistant' && (
        msg.content.includes('##AI_INSTRUCTION##') ||
        msg.content.includes('가이드해줘') || 
        msg.content.includes('피드백해줘'))
      ) {
        return false;
      }
      
      return true;
    });
    
    console.log(`getActualConversation: ${messages.length}개 중 ${filtered.length}개 메시지 필터링됨`);
    return filtered;
  }, []);
  
  // 대화에서 마지막 사용자-AI 메시지 쌍 찾기
  const getLastUserAIExchange = useCallback((messages) => {
    const actualMessages = getActualConversation(messages);
    console.log(`getLastUserAIExchange: 총 ${messages?.length || 0}개의 메시지 중 필터링된 메시지 수: ${actualMessages.length}`);
    
    if (actualMessages.length === 0) {
      console.log('getLastUserAIExchange: 필터링 후 표시할 메시지 없음');
      return '대화 내용 없음';
    }
    
    // 마지막 AI 메시지 찾기
    for (let i = actualMessages.length - 1; i >= 0; i--) {
      if (actualMessages[i].role === 'assistant') {
        const lastMessage = actualMessages[i].content.substring(0, 100) + 
                          (actualMessages[i].content.length > 100 ? '...' : '');
        console.log(`getLastUserAIExchange: AI 메시지 찾음 (인덱스: ${i}): ${lastMessage}`);
        return lastMessage;
      }
    }
    
    // AI 메시지를 찾지 못했을 경우 가장 최근 메시지 반환
    const fallbackMessage = actualMessages[actualMessages.length - 1].content.substring(0, 100) + 
                          (actualMessages[actualMessages.length - 1].content.length > 100 ? '...' : '');
    console.log(`getLastUserAIExchange: AI 메시지 없음, 마지막 메시지 사용: ${fallbackMessage}`);
    return fallbackMessage;
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
  
  // 각 데이터 로드 함수를 useCallback으로 감싸서 의존성 문제 해결
  const fetchChatData = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    console.log('🔍 Fetching conversations for teacher ID:', user.uid);
    
    // 인덱스 문제를 해결하기 위해 쿼리 단순화
    // 모든 대화를 가져오고 클라이언트에서 필터링
    const q = query(
      collection(db, "conversations"),
      orderBy("timestamp", "desc"),
      limit(200)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('📊 Raw conversations found:', querySnapshot.size);
    
    const allConversations = [];
    const studentMap = new Map();
    
    // 전체 대화 데이터 수집
    querySnapshot.forEach((doc) => {
      const convData = doc.data();
      
      // 클라이언트에서 현재 교사의 대화만 필터링
      if (convData.teacherId === user.uid && convData.studentId) {
        console.log('💬 Matched conversation:', {
          id: doc.id,
          studentId: convData.studentId,
          studentName: convData.studentName,
          timestamp: convData.timestamp?.toDate() || new Date(),
          messageCount: convData.messages?.length || 0
        });
        
        // 디버깅을 위한 메시지 내용 로깅
        if (convData.studentName === '김상섭') {
          console.log('김상섭 학생 대화 데이터:', {
            messageCount: convData.messages?.length || 0,
            firstMessage: convData.messages && convData.messages.length > 0 ? 
              { role: convData.messages[0].role, content: convData.messages[0].content.substring(0, 50) + '...' } : 'No messages',
            lastMessage: convData.messages && convData.messages.length > 0 ? 
              { role: convData.messages[convData.messages.length-1].role, content: convData.messages[convData.messages.length-1].content.substring(0, 50) + '...' } : 'No messages'
          });
        }
        
        // 마지막 메시지 내용 개선
        const processedMessages = processChatMessages(convData.messages);
        const lastMessage = getLastUserAIExchange(convData.messages);
        
        // 디버깅을 위한 정보 출력
        if (convData.studentName === '김상섭') {
          console.log('김상섭 학생 처리된 메시지:', {
            processedCount: processedMessages.length,
            lastMessage: lastMessage
          });
        }
        
        const enhancedConvData = {
          ...convData,
          id: doc.id,
          displayMessages: processedMessages,
          displayLastMessage: lastMessage,
          timestamp: convData.timestamp?.toDate() || new Date()
        };
        
        allConversations.push(enhancedConvData);
        
        // 고유 학생 목록 생성
        if (convData.studentName) {
          studentMap.set(convData.studentId, convData.studentName);
        }
      }
    });
    
    console.log('👨‍👩‍👧‍👦 Unique students:', studentMap.size);
    console.log('💬 Total valid conversations:', allConversations.length);
    
    // 학생별로 대화 세션 통합
    const studentConversations = new Map();
    
    // 학생별 대화 그룹화
    allConversations.forEach(conv => {
      if (!studentConversations.has(conv.studentId)) {
        studentConversations.set(conv.studentId, {
          id: `combined_${conv.studentId}`,
          studentId: conv.studentId,
          studentName: conv.studentName,
          teacherId: conv.teacherId,
          conversations: [],
          timestamp: conv.timestamp,
          totalTokens: 0,
          displayMessages: []
        });
      }
      
      const studentConv = studentConversations.get(conv.studentId);
      studentConv.conversations.push(conv);
      studentConv.totalTokens += conv.totalTokens || 0;
      
      // 더 최신 타임스탬프로 업데이트
      if (conv.timestamp > studentConv.timestamp) {
        studentConv.timestamp = conv.timestamp;
        studentConv.displayLastMessage = conv.displayLastMessage;
      }
    });
    
    // 모든 대화 메시지 통합 및 중복 제거
    studentConversations.forEach(studentConv => {
      // 시간순으로 대화 정렬
      studentConv.conversations.sort((a, b) => a.timestamp - b.timestamp);
      
      // 모든 대화의 메시지 통합
      const allMessages = [];
      studentConv.conversations.forEach(conv => {
        if (conv.displayMessages && Array.isArray(conv.displayMessages)) {
          allMessages.push(...conv.displayMessages);
        }
      });
      
      // 중복 제거
      const uniqueMessages = [];
      const seen = new Set();
      
      allMessages.forEach(msg => {
        const msgKey = `${msg.role}:${msg.content.substring(0, 50)}`;
        if (!seen.has(msgKey)) {
          seen.add(msgKey);
          uniqueMessages.push(msg);
        }
      });
      
      // 시간순 정렬 (가정: 메시지에 타임스탬프가 없으므로 순서대로 정렬)
      studentConv.displayMessages = uniqueMessages;
    });
    
    // Map에서 배열로 변환하고 최신순 정렬
    const combinedConversations = Array.from(studentConversations.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log('🔄 Combined conversations:', combinedConversations.length);
    
    setConversations(combinedConversations);
    setStudents(Array.from(studentMap).map(([id, name]) => ({ id, name })));
  }, [processChatMessages, getLastUserAIExchange]);
  
  // 퀴즈 데이터 로드 함수 (향후 구현)
  const fetchQuizData = useCallback(async () => {
    // 퀴즈 관련 데이터 로딩 로직
    console.log('퀴즈 데이터 로드 예정');
    setConversations([]);
    setStudents([]);
  }, []);
  
  // 작문 데이터 로드 함수 (향후 구현)
  const fetchWritingData = useCallback(async () => {
    // 작문 관련 데이터 로딩 로직
    console.log('작문 데이터 로드 예정');
    setConversations([]);
    setStudents([]);
  }, []);
  
  // fetchData를 useCallback으로 감싸서 의존성 문제 해결
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setShowConversationList(true);
      setSelectedConversation(null);
      
      // 타입에 따라 다른 컬렉션 또는 필터링 로직 적용
      if (dashboardType === 'chat') {
        await fetchChatData();
      } else if (dashboardType === 'quiz') {
        // 향후 확장: 퀴즈 데이터 로드
        await fetchQuizData();
      } else if (dashboardType === 'writing') {
        // 향후 확장: 작문 데이터 로드
        await fetchWritingData();
      }
      
      // 데이터 로드 시간 업데이트
      setLastRefreshTime(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error(`Error fetching ${dashboardType} data:`, error);
      setIsLoading(false);
    }
  }, [dashboardType, fetchChatData, fetchQuizData, fetchWritingData]);
  
  useEffect(() => {
    // 패널이 열릴 때만 데이터를 로드
    if (isOpen) {
      console.log("DashboardPanel - Panel opened, loading data");
      fetchData();
    }
  }, [isOpen, fetchData]);
  
  useEffect(() => {
    // 데이터 및 선택된 학생에 따른 필터링 로그
    if (conversations.length > 0) {
      console.log(`DashboardPanel - Total conversations: ${conversations.length}`);
      console.log(`DashboardPanel - Filtered conversations: ${filteredConversations.length}`);
    }
  }, [conversations, selectedStudent, filteredConversations.length]);
  
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
  
  // 학생 필터 변경 처리
  const handleStudentFilterChange = (e) => {
    const studentId = e.target.value || null;
    setSelectedStudent(studentId);
  };
  
  // 대시보드 타입에 따른 제목 표시
  const getDashboardTitle = () => {
    switch (dashboardType) {
      case 'chat':
        return '채팅 대화 내역 대시보드';
      case 'quiz':
        return '퀴즈 결과 대시보드';
      case 'writing':
        return '작문 활동 대시보드';
      default:
        return '학생 활동 대시보드';
    }
  };
  
  // 데이터 초기화 처리 함수 - Firestore에서 데이터 실제 삭제
  const resetData = async () => {
    setIsResetting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('❌ 로그인된 사용자 정보를 찾을 수 없습니다.');
        setIsResetting(false);
        return;
      }
      
      // 교사 ID로 필터링된 대화 데이터 조회
      const q = query(
        collection(db, "conversations"),
        where("teacherId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`🔍 삭제할 대화 데이터: ${querySnapshot.size}개 찾음`);
      
      if (querySnapshot.size === 0) {
        console.log('삭제할 대화 데이터가 없습니다.');
        setIsResetting(false);
        return;
      }
      
      // 삭제 작업을 Promise 배열로 수집
      const deletePromises = [];
      
      querySnapshot.forEach((document) => {
        console.log(`🗑️ 삭제 중: ${document.id}`);
        deletePromises.push(deleteDoc(doc(db, "conversations", document.id)));
      });
      
      // 모든 삭제 작업 실행
      await Promise.all(deletePromises);
      
      console.log('✅ 모든 대화 데이터가 성공적으로 삭제되었습니다.');
      
      // 로컬 상태 초기화
      setConversations([]);
      setSelectedStudent(null);
      setStudents([]);
      setSelectedConversation(null);
      setShowConversationList(true);
      setLastRefreshTime(new Date());
      
    } catch (error) {
      console.error('❌ 대화 데이터 삭제 중 오류 발생:', error);
    } finally {
      setIsResetting(false);
    }
  };
  
  // 초기화 확인 처리
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };
  
  // 초기화 확인 취소
  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };
  
  // 초기화 확인 승인
  const handleConfirmReset = () => {
    resetData();
    setShowResetConfirm(false);
  };
  
  // 데이터 새로고침 처리 함수
  const handleRefresh = async () => {
    if (isRefreshing) return; // 이미 새로고침 중이면 중복 실행 방지
    
    console.log('🔄 Refreshing dashboard data...');
    setIsRefreshing(true);
    
    try {
      await fetchData();
      console.log('✅ Dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // 마지막 새로고침 시간을 포맷팅하는 함수
  const formatRefreshTime = () => {
    if (!lastRefreshTime) return '업데이트 없음';
    
    return lastRefreshTime.toLocaleString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // 아이콘 렌더링 함수
  const renderResetIcon = () => {
    if (isResetting) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };
  
  const renderRefreshIcon = () => {
    // 항상 동일한 SVG 아이콘을 반환, 로딩 중일 때는 클래스만 추가
    return (
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={isRefreshing ? "rotate-icon" : ""}
      >
        <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.51 9.00001C4.01717 7.56328 4.87913 6.28226 6.01547 5.27208C7.1518 4.26189 8.52547 3.55518 10.0083 3.22295C11.4911 2.89073 13.0348 2.94212 14.4952 3.37147C15.9556 3.80082 17.2853 4.59325 18.36 5.67001L23 10M1 14L5.64 18.33C6.71475 19.4068 8.04437 20.1992 9.50481 20.6286C10.9652 21.0579 12.5089 21.1093 13.9917 20.7771C15.4745 20.4448 16.8482 19.7381 17.9845 18.728C19.1209 17.7178 19.9828 16.4368 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };
  
  // 패널이 닫혀 있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;
  
  return (
    <div className="dashboard-panel-overlay" onClick={onClose}>
      <div 
        className={`dashboard-panel ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dashboard-panel-header">
          <h2>{getDashboardTitle()}</h2>
          <div className="dashboard-panel-header-actions">
            <div className="last-refresh-time" title="마지막 업데이트 시간">
              {lastRefreshTime && `${formatRefreshTime()} 업데이트`}
            </div>
            <button 
              className="reset-button" 
              onClick={handleResetClick}
              disabled={isResetting || isRefreshing}
              aria-label="데이터 초기화"
              title="데이터 초기화"
            >
              {renderResetIcon()}
            </button>
            <button 
              className="refresh-button" 
              onClick={handleRefresh}
              disabled={isRefreshing || isResetting}
              aria-label="데이터 새로고침"
              title="최신 데이터로 새로고침"
            >
              {renderRefreshIcon()}
            </button>
            <button className="close-button" onClick={onClose} aria-label="대시보드 닫기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="dashboard-panel-content">
          {isResetting && (
            <div className="refresh-indicator">
              <div className="refresh-spinner"></div>
              <p>데이터를 초기화하는 중...</p>
            </div>
          )}
          
          {showResetConfirm && (
            <div className="reset-confirm-overlay">
              <div className="reset-confirm-dialog">
                <h3>대화 데이터 삭제</h3>
                <p><strong>주의:</strong> 모든 학생 대화 데이터가 <strong>영구적으로 삭제</strong>됩니다.</p>
                <div className="reset-confirm-actions">
                  <button onClick={handleCancelReset} className="cancel-button">취소</button>
                  <button onClick={handleConfirmReset} className="confirm-button">삭제 확인</button>
                </div>
              </div>
            </div>
          )}
          
          <div className="dashboard-layout">
            <div className="sidebar">
              <div className="filter-section">
                <h3>학생 목록</h3>
                <div className="select-container">
                  <select 
                    value={selectedStudent || ''} 
                    onChange={handleStudentFilterChange}
                    className="student-select"
                  >
                    <option value="">모든 학생 보기</option>
                    {students.length > 0 ? (
                      students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>등록된 학생이 없습니다</option>
                    )}
                  </select>
                </div>
                <div className="filter-stats">
                  <p>전체 학생 수: <span className="stat-value">{students.length}</span>명</p>
                </div>
              </div>
            </div>

            <div className="main-content">
              {showConversationList ? (
                <div className="conversation-list">
                  <h3>학생 대화 목록</h3>
                  {isLoading ? (
                    <div className="loading-message">데이터를 불러오는 중...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="no-data-message">
                      {selectedStudent ? (
                        `선택한 학생(${students.find(s => s.id === selectedStudent)?.name || selectedStudent})의 대화 내역이 없습니다.`
                      ) : '저장된 대화가 없습니다.'}
                    </div>
                  ) : (
                    <>
                      <div className="debug-info" style={{marginBottom: '10px', fontSize: '12px', color: '#666'}}>
                        총 {filteredConversations.length}개의 대화 내역이 있습니다.
                      </div>
                      <div className="conversation-items">
                        {filteredConversations.map((conversation) => (
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
                              <span title={conversation.displayLastMessage || '내용 없음'}>
                                {conversation.displayLastMessage || (
                                  conversation.conversations && conversation.conversations.length > 0 ?
                                  `${conversation.conversations.length}개의 학생 대화가 있습니다.` : 
                                  '내용 없음'
                                )}
                              </span>
                              <span className="message-count">{conversation.displayMessages?.length || 0}개 메시지</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
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
              <h3>학생 통계</h3>
              <p>등록된 학생 <span>{students.length}명</span></p>
              <p>대화 세션 <span>{conversations.length}개</span></p>
            </div>
            <div className="stat-card">
              <h3>최근 활동</h3>
              {conversations.length > 0 ? (
                <>
                  <p>마지막 대화 <span>{new Date(conversations[0].timestamp).toLocaleString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span></p>
                  <p>활동 학생 <span>{conversations[0].studentName || '이름 없음'}</span></p>
                </>
              ) : (
                <p>최근 활동 없음</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel; 