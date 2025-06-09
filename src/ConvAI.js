import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, where, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Cookies from 'js-cookie';
import './App.css';
import './custom.css';
import PromptButton from './PromptButton';
import NotificationModal from './NotificationModal';

const API_URL = '/api/conv-ai';

const ChatMessage = ({ message, isFirstMessage }) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (message.role === 'assistant') {
      let index = 0;
      const intervalId = setInterval(() => {
        setDisplayedContent(message.content.slice(0, index));
        index++;
        if (index > message.content.length) {
          clearInterval(intervalId);
        }
      }, 20);
      return () => clearInterval(intervalId);
    } else {
      setDisplayedContent(message.content);
    }
  }, [message]);

  if (message.role === 'system') return null;

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div style={{ whiteSpace: 'break-spaces' }} className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-gray-800'
      }`}>
        {displayedContent}
      </div>
    </div>
  );
};

const MiniPopup = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="px-2 top-10 right-40 mt-2 mr-2 bg-black text-white text-sm rounded p-2 z-10 shadow-lg"
      style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '50px',
        animation: 'blink 2s linear infinite'
      }}
    >
      <style jsx>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      <span>❤️ 프롬프트 설정</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-200 ">
        &times;
      </button>
    </div>
  );
};

const PromptModal = ({ isOpen, onClose, onSave, onDelete, onApply, initialPrompt }) => {
  const [prompt, setPrompt] = useState(initialPrompt || {
    title: '',
    baseRole: '',
    aiPrompt: '',
    greeting: ''
  });

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    } else {
      setPrompt({
        title: '',
        baseRole: '',
        aiPrompt: '',
        greeting: ''
      });
    }
  }, [initialPrompt]);

  const handleChange = (e) => {
    setPrompt({ ...prompt, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4">📝 프롬프트 내용</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="title">
              제목
            </label>
            <input
              id="title"
              name="title"
              value={prompt.title}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="baseRole">
              기본 역할과 규칙
            </label>
            <textarea
              id="baseRole"
              name="baseRole"
              value={prompt.baseRole}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="greeting">
              첫인사말
            </label>
            <textarea
              id="greeting"
              name="greeting"
              value={prompt.greeting}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="2"
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="aiPrompt">
              AI가 수행할 프롬프트
            </label>
            <textarea
              id="aiPrompt"
              name="aiPrompt"
              value={prompt.aiPrompt}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
            ></textarea>
          </div>
          <div className="flex justify-between items-center mt-6">
            <div>
              {onDelete && prompt.id && (
                <button
                  type="button"
                  onClick={() => onDelete(prompt.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300 mr-2"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-300"
              >
                취소
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onApply(prompt)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 mr-2"
              >
                프롬프트 적용
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                {prompt.id ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

function ConvAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRightSideTabOpen, setIsRightSideTabOpen] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isPopupVisible, setIsPopupVisible] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0); // Add state for total tokens
  const chatContainerRef = useRef(null);
  const [studentSession] = useState(() => {
    const sessionData = Cookies.get('studentSession');
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const fetchPrompts = useCallback(async () => {
    const user = auth.currentUser;
    const teacherId = studentSession ? studentSession.teacherId : user?.uid;
    if (!teacherId) {
      console.error("User not authenticated");
      return;
    }
  
    try {
      console.log("Fetching prompts for user:", teacherId);
      const promptsRef = collection(db, "aiPrompts");
      const q = query(
        promptsRef, 
        where("userId", "==", teacherId), 
        orderBy("createdAt", "desc"), 
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const promptList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched prompts:", promptList);
      setPrompts(promptList);
    } catch (error) {
      console.error("Error in fetchPrompts:", error);
      if (error.code) {
        console.error("Firebase error code:", error.code);
      }
      alert(`프롬프트를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }
  }, [studentSession]);

  const fetchDefaultPrompt = useCallback(async () => {
    const user = auth.currentUser;
    const teacherId = studentSession ? studentSession.teacherId : user?.uid;
    if (!teacherId) {
      console.error("User not authenticated");
      return;
    }
  
    try {
      console.log("Fetching default prompt for user:", teacherId);
      const defaultPromptRef = doc(db, "defaultPrompts", teacherId);
      const docSnapshot = await getDoc(defaultPromptRef);
      if (docSnapshot.exists()) {
        const defaultPrompt = docSnapshot.data();
        setCurrentPrompt(defaultPrompt);
        // Display greeting message
        if (defaultPrompt.greeting) {
          setMessages([{ role: 'assistant', content: defaultPrompt.greeting }]);
          setIsFirstMessage(true);
        }
      } else {
        console.log("No default prompt found for user:", teacherId);
      }
    } catch (error) {
      console.error("Error in fetchDefaultPrompt:", error);
      alert(`기본 프롬프트를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }
  }, [studentSession]);

  useEffect(() => {
    fetchPrompts();
    fetchDefaultPrompt();
  }, [fetchDefaultPrompt, fetchPrompts]);

  useEffect(() => {
    if (currentPrompt) {
      setTotalTokens(0); // Reset total tokens when the prompt changes
    }
  }, [currentPrompt]);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsFirstMessage(false);
  
    const historyWithPrompt = [...messages, userMessage];
  
    if (!historyWithPrompt.find((message) => message.role === 'system') && currentPrompt) {
      const systemMessage = {
        role: 'system',
        content: currentPrompt.baseRole
      };
      const assistantMessage = {
        role: 'assistant',
        content: `##AI_INSTRUCTION## ${currentPrompt.aiPrompt}`,
      };
      historyWithPrompt.unshift(systemMessage);
      
      // AI 지시사항이 있는 경우만 추가
      if (currentPrompt.aiPrompt) {
        historyWithPrompt.push(assistantMessage);
      }
    }
  
    const user = auth.currentUser;
    const session = studentSession || {};
    const userId = user ? user.uid : session.teacherId;
  
    if (!userId) {
      alert('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }
    
    // 학생 세션 정보 디버깅 로그
    console.log('🧩 Current session info:', {
      isStudent: !!studentSession,
      studentId: session.studentId || 'not available',
      studentName: session.studentName || 'not available',
      teacherId: session.teacherId || 'not available'
    });
  
    try {
      console.log('Sending request with data:', { 
        message: input,
        history: historyWithPrompt,
        userId: userId,
        teacherId: session.teacherId || null,
        currentPrompt: currentPrompt,
        studentId: session.studentId || null,
        studentName: session.studentName || null
      });
  
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          history: historyWithPrompt,
          userId: userId,
          teacherId: session.teacherId || null,
          currentPrompt: currentPrompt,
          studentId: session.studentId || null,
          studentName: session.studentName || null
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Received response:', data);
  
      if (data.error) {
        throw new Error(data.error);
      }
  
      const aiMessage = { role: 'assistant', content: data.result };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setTotalTokens(data.tokens); // Update the total tokens used
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: `오류가 발생했습니다: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrompt = async (newPrompt) => {
    const user = auth.currentUser;
    const session = studentSession || {};
    const teacherId = session.teacherId || user?.uid;
  
    if (!teacherId) {
      console.error("User not authenticated");
      alert('로그인이 필요합니다.');
      return;
    }
  
    try {
      if (newPrompt.id) {
        // Update the existing prompt
        const promptRef = doc(db, "aiPrompts", newPrompt.id);
        console.log("Updating existing prompt with ID:", newPrompt.id);
        await updateDoc(promptRef, {
          ...newPrompt,
          updatedAt: serverTimestamp()
        });
        console.log("Prompt updated successfully");
      } else {
        // Add new prompt
        console.log("Adding new prompt");
        const docRef = await addDoc(collection(db, "aiPrompts"), {
          ...newPrompt,
          userId: teacherId,
          createdAt: serverTimestamp()
        });
        console.log("New prompt added with ID:", docRef.id);
      }

      setIsPromptModalOpen(false);
      await fetchPrompts();
    } catch (error) {
      console.error("Error in handleSavePrompt:", error);
      if (error.code) {
        console.error("Firebase error code:", error.code);
      }
      alert(`프롬프트 저장/업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleDeletePrompt = async (promptId) => {
    const user = auth.currentUser;
    const session = studentSession || {};
    const teacherId = session.teacherId || user?.uid;

    if (!teacherId) {
      console.error("User not authenticated");
      alert('로그인이 필요합니다.');
      return;
    }

    if (window.confirm('이 프롬프트를 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, "aiPrompts", promptId));
        console.log("Prompt deleted with ID: ", promptId);
        setIsPromptModalOpen(false);
        setNotificationMessage('프롬프트가 성공적으로 삭제되었습니다.');
        setIsNotificationModalOpen(true);
        if (currentPrompt && currentPrompt.id === promptId) {
          setCurrentPrompt(null);
        }
        fetchPrompts();
      } catch (error) {
        console.error("Error deleting prompt: ", error);
        alert('프롬프트 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setIsPromptModalOpen(true);
  };

  const handleApplyPrompt = async (prompt) => {
    const user = auth.currentUser;
    const session = studentSession || {};
    const teacherId = session.teacherId || user?.uid;

    if (!teacherId) {
      console.error("User not authenticated");
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 기본 프롬프트로 설정
      const defaultPromptRef = doc(db, "defaultPrompts", teacherId);
      await setDoc(defaultPromptRef, prompt);
      console.log("Default prompt set for user:", teacherId);

      setCurrentPrompt(prompt);
      setIsPromptModalOpen(false);
      setMessages([]);
      setTotalTokens(0); // Reset the total tokens used
      
      // Display greeting message
      if (prompt.greeting) {
        setMessages([{ role: 'assistant', content: prompt.greeting }]);
        setIsFirstMessage(true);
      }
    } catch (error) {
      console.error("Error in handleApplyPrompt:", error);
      alert(`기본 프롬프트 설정 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-grow py-6 flex justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-7xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white sm:rounded-3xl sm:p-20">
          <div className="max-w-6xl mx-auto">
            <div className="w-[760px] px-4">
              <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">✨ AI 채팅 도우미</h1>
              <div className="text-sm font-normal text-center mb-10 text-gray-400">Chatgpt-4.1 기반</div>
              {currentPrompt && (
                <div className="mb-4 text-left text-base text-gray-600 flex justify-between items-center">
                  <div>✨ 현재 챗봇 모드 : <strong>{currentPrompt.title}</strong></div>
                  <div>🏷️사용된 토큰 : <strong>{totalTokens}</strong></div>
                </div>
              )}
              <div 
                ref={chatContainerRef}
                className="mb-4 h-[280px] bg-gray-100 p-4 rounded-lg overflow-y-scroll flex flex-col-reverse relative"
              >
                <div className="flex flex-col">
                  {messages.map((message, index) => (
                    <ChatMessage 
                      key={index} 
                      message={message} 
                      isFirstMessage={index === 0 && isFirstMessage}
                    />
                  ))}
                </div>
                {isLoading && <div className="blinking-dot"></div>}
              </div>
              <div className="mb-8 relative">
                <textarea
                  className="w-full text-gray-700 leading-tight"
                  style={{
                    background: 'rgb(237 237 237)',
                    padding: '15px',
                    borderRadius: '16px',
                    resize: 'none',
                    border: isFocused ? '3px solid #4A90E2' : '3px solid transparent',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  rows="1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyPress={handleKeyPress}
                  placeholder="AI에게 메시지를 입력하세요..."
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-3 bottom-5 w-8 h-8 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out ${
                    (!input.trim() || isLoading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="w-full flex mt-8">
                <div className="w-full">
                  <h3 className="text-base font-semibold mb-4">🍀 챗봇 프롬프트 보기</h3>
                  <div className="flex flex-col space-y-3">
                    {currentPrompt && (
                      <PromptButton key={currentPrompt.id} prompt={currentPrompt} onClick={() => handleEditPrompt(currentPrompt)} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side tab toggle button and MiniPopup */}
      <MiniPopup 
        isVisible={isPopupVisible}
        onClose={() => setIsPopupVisible(false)}
      />
      <button
        onClick={() => setIsRightSideTabOpen(!isRightSideTabOpen)}
        className="fixed right-4 top-4 z-50 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 transition duration-300 ease-in-out tab-toggle"
      >
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>


      {/* Right side tab toggle button and MiniPopup */}
      <button
        onClick={() => setIsRightSideTabOpen(!isRightSideTabOpen)}
        className="fixed right-4 top-4 z-50 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 transition duration-300 ease-in-out tab-toggle"
      >
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div 
        className={`fixed right-0 bg-white shadow-lg transform ${isRightSideTabOpen ? 'translate-x-0' : 'translate-x-full'} transition duration-300 ease-in-out z-50 side-tab`} 
        style={{
          top: '80px',
          bottom: '80px',
          background: 'rgb(247, 247, 245)',
          borderRadius: '15px',
          width: '340px',
          marginRight: '5px',
          border: '1px solid rgb(233 233 233)',
          zIndex: '10'
        }}
      >
        <div className="p-6 h-full overflow-y-auto relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🛠️ 사전 프롬프트 설정</h2>
            <button
              onClick={() => {
                setSelectedPrompt({
                  title: '',
                  baseRole: '',
                  aiPrompt: '',
                  greeting: ''
                });
                setIsPromptModalOpen(true);
              }}
              className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col space-y-3">
            {prompts.map((prompt) => (
              <button
              key={prompt.id}
              onClick={() => handleEditPrompt(prompt)}
              className={`relative bg-gradient-to-r ${
                currentPrompt && currentPrompt.id === prompt.id
                  ? 'from-green-500 to-teal-600'
                  : 'from-blue-500 to-purple-500'
              } text-white rounded-lg px-4 py-3 hover:from-blue-600 hover:to-purple-600 transition duration-300 text-left overflow-hidden shadow-md`}
            >
              {currentPrompt && currentPrompt.id === prompt.id && (
                <div className="absolute top-6 right-1 transform -translate-x-1/4 -translate-y-4">
                  <div className="bg-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="green">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
              <p className="text-base text-white truncate mb-1">{prompt.title}</p>
              <p className="text-xs text-gray-200" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prompt.aiPrompt.length > 100 ? prompt.aiPrompt.slice(0, 100) + '...' : prompt.aiPrompt}
              </p>
            </button>
            ))}
          </div>
        </div>
      </div>

      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setSelectedPrompt(null);
        }}
        onSave={handleSavePrompt}
        onDelete={handleDeletePrompt}
        onApply={handleApplyPrompt}
        initialPrompt={selectedPrompt}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        message={notificationMessage}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </div>
  );
}

export default ConvAI;