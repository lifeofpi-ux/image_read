import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, where, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Cookies from 'js-cookie';
import './App.css';
import './custom.css';

const API_URL = '/api/conv-ai';

const ChatMessage = ({ message }) => {
  if (message.role === 'system' || message.role === 'assistant' && message.isInit) return null; // 시스템 메시지와 초기 assistant 메시지는 화면에 노출되지 않도록 처리
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
        {message.content}
      </div>
    </div>
  );
};

const PromptButton = ({ prompt, onClick }) => {
  if (!prompt) return null;

  return (
    <button
      onClick={() => onClick(prompt)}
      className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg px-6 py-3 hover:from-blue-500 hover:to-indigo-600 transition duration-300 text-left overflow-hidden text-ellipsis whitespace-nowrap w-full shadow-md"
    >
      {prompt.title.length > 50 ? prompt.title.substring(0, 50) + '...' : prompt.title}
    </button>
  );
};

const PromptModal = ({ isOpen, onClose, onSave, onDelete, onApply, initialPrompt }) => {
  const [prompt, setPrompt] = useState(initialPrompt || {
    title: '',
    baseRole: '',
    aiPrompt: ''
  });

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    } else {
      setPrompt({
        title: '',
        baseRole: '',
        aiPrompt: ''
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

const NotificationModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-80 w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4">알림</h2>
        <p>{message}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          닫기
        </button>
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
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [studentSession] = useState(() => {
    const sessionData = Cookies.get('studentSession');
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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
      setRecentPrompts(promptList);
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
  }, [fetchPrompts, fetchDefaultPrompt]);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { role: 'user', content: input };
    const historyWithPrompt = [...messages];
  
    if (!historyWithPrompt.find((message) => message.role === 'system') && currentPrompt) {
      const systemMessage = {
        role: 'system',
        content: currentPrompt.baseRole
      };
      const assistantMessage = {
        role: 'assistant',
        content: currentPrompt.aiPrompt,
        isInit: true // 추가된 부분
      };
      historyWithPrompt.unshift(systemMessage);
      historyWithPrompt.push(assistantMessage);
    }
  
    historyWithPrompt.push(userMessage);
    setMessages(historyWithPrompt);
    setInput('');
    setIsLoading(true);
  
    const user = auth.currentUser;
    const session = studentSession || {};
    const userId = user ? user.uid : session.teacherId;
  
    if (!userId) {
      alert('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }
  
    try {
      console.log('Sending request with data:', { 
        message: input,
        history: historyWithPrompt,
        userId: userId,
        teacherId: session.teacherId || null,
        currentPrompt: currentPrompt
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
          currentPrompt: currentPrompt
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
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: `오류가 발생했습니다: ${error.message}` }]);
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
    } catch (error) {
      console.error("Error in handleApplyPrompt:", error);
      alert(`기본 프롬프트 설정 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  return (
    <div className="flex-grow py-6 flex justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-7xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white sm:rounded-3xl sm:p-20">
          <div className="max-w-6xl mx-auto">
            <div className="w-[760px] px-4">
              <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">✨ AI 채팅 도우미</h1>
              <div className="text-sm font-normal text-center mb-10 text-gray-400">ChatGPT-4 기반</div>
              {currentPrompt && (
                <div className="mb-4 text-left text-sm text-gray-600">
                  ✨ 현재 챗봇 모드  <strong>{currentPrompt.title}</strong>
                </div>
              )}
              <div className="mb-4 h-[280px] overflow-y-auto bg-gray-100 p-4 rounded-lg">
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                <div ref={messagesEndRef} />
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
                  placeholder="AI에게 메시지를 입력하세요..."
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-3 bottom-4 w-8 h-8 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out ${
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
                  <h3 className="text-base font-semibold mb-4">📑 현재 챗봇 모드</h3>
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
                  aiPrompt: ''
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
                className={`bg-gradient-to-r ${
                  currentPrompt && currentPrompt.id === prompt.id
                    ? 'from-green-500 to-teal-600'
                    : 'from-blue-500 to-purple-500'
                } text-white rounded-lg px-4 py-3 hover:from-blue-600 hover:to-purple-600 transition duration-300 text-left overflow-hidden shadow-md`}
              >
                <p className="text-base text-base text-white-900 truncate mb-1">{prompt.title}</p>
                <p className="text-xs text-gray-200">{prompt.aiPrompt}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsRightSideTabOpen(!isRightSideTabOpen)}
        className="fixed right-4 top-4 z-50 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 transition duration-300 ease-in-out tab-toggle"
      >
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

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
