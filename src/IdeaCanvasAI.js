import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import Cookies from 'js-cookie';
import axios from 'axios';
import './App.css';
import './custom.css';
import PostModal from './PostModal';
import { FaEdit, FaExpand, FaPlus, FaSync, FaComments } from 'react-icons/fa';

const API_URL = '/api/analyze-ideas'; 

const ExpandedPostModal = ({ isOpen, onClose, post }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-[500px] w-full max-h-[500px] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{post.author}</h2>
        <p className="text-gray-700 mb-4">{post.text}</p>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

const Post = ({ post, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const postStyles = {
    width: '200px',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    background: 'bg-blue-300',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    padding: '5px 10px 10px 10px'
  };

  const contentStyles = {
    flex: 1,
    overflowY: 'auto',
    wordBreak: 'break-word',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent',
    padding: '10px',
  };

  const buttonStyles = {
    background: 'transparent',
    border: 'none',
    color: '#4a5568',
    padding: '5px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const scrollbarStyles = `
    .post-content::-webkit-scrollbar {
      width: 2px;
    }
    .post-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .post-content::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }
    .post-content::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        className="relative text-sm text-gray-800 m-2 flex-shrink-0 bg-customYellow"
        style={postStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="text-base font-semibold p-3 pb-0 highlight-effect">{post.author}</div>
        <div className="post-content" style={contentStyles}>
          <p>{post.text}</p>
        </div>
        {isHovered && (
          <div className="absolute top-2 right-2 flex space-x-2">
            <button
              onClick={() => onEdit(post)}
              style={buttonStyles}
              className="hover:bg-gray-200"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              style={buttonStyles}
              className="hover:bg-gray-200"
            >
              <FaExpand />
            </button>
          </div>
        )}
      </div>
      <ExpandedPostModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        post={post}
      />
    </>
  );
};


const ChatMessage = ({ message }) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div style={{ whiteSpace: 'break-spaces' }} className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-gray-800'
      }`}>
        {message.content}
      </div>
    </div>
  );
};

const ChatPrompt = ({ isOpen, onClose, onSendMessage, messages, currentMessage, setCurrentMessage, isLoading }) => {
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const scrollbarStyles = `
    .chat-content::-webkit-scrollbar {
      width: 2px;
    }
    .chat-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .chat-content::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }
    .chat-content::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
  `;

  return (
    <div className="fixed right-0 top-0 bottom-0 bg-white shadow-lg transform translate-x-0 transition duration-300 ease-in-out z-50" 
         style={{
           top: '80px',
           bottom: '80px',
           background: 'rgb(247, 247, 245)',
           borderRadius: '15px',
           width: '340px',
           marginRight: '5px',
           border: '1px solid rgb(233 233 233)',
           zIndex: '10'
         }}>
      <style>{scrollbarStyles}</style>
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">🍀 AI Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition duration-300"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div 
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto mb-4 chat-content"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent',
            display: 'flex',
            flexDirection: 'column-reverse'
          }}
        >
          {messages.slice().reverse().map((msg, idx) => (
            <ChatMessage key={messages.length - 1 - idx} message={msg} />
          ))}
        </div>
        <div className="relative">
          <textarea
            className="w-full text-gray-700 leading-tight pr-14 pl-4"
            style={{
              background: 'rgb(237 237 237)',
              padding: '12px 50px 15px 15px',
              borderRadius: '16px',
              resize: 'none',
              border: '3px solid transparent',
              transition: 'border-color 0.3s ease',
              outline: 'none',
              height: '50px',
              overflowY: 'hidden'
            }}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
          />
          <button
            className="absolute right-3 bottom-4 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={onSendMessage}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {isLoading && (
          <div className="relative bottom-20 left-3 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
        )}
      </div>
    </div>
  );
};

const IdeaCanvasAI = () => {
  const [posts, setPosts] = useState([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isChatPromptOpen, setIsChatPromptOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentSession] = useState(() => {
    const sessionData = Cookies.get('studentSession');
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const fetchPosts = useCallback(async () => {
    const user = auth.currentUser;
    const session = studentSession;
    const teacherId = session?.teacherId || user?.uid;

    if (!teacherId) return;

    const postsRef = collection(db, "Posts");
    const q = query(postsRef, where("teacherId", "==", teacherId), orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    const postList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPosts(postList);
  }, [studentSession]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleAddPost = async (post) => {
    const newPost = {
      ...post,
      createdAt: serverTimestamp(),
      teacherId: auth.currentUser?.uid || studentSession?.teacherId,
    };
    try {
      const docRef = await addDoc(collection(db, "Posts"), newPost);
      setPosts(prevPosts => [...prevPosts, { ...newPost, id: docRef.id }]);
    } catch (error) {
      console.error('Error adding post: ', error);
    }
  };

  const handleEditPost = (post) => {
    setEditPost(post);
    setIsEditPostModalOpen(true);
  };

  const handleSaveEditedPost = async (editedPost) => {
    if (!editedPost || !editedPost.id) {
      console.error('유효하지 않은 포스트 데이터:', editedPost);
      alert('수정할 포스트가 유효하지 않습니다.');
      return;
    }
    const postRef = doc(db, "Posts", editedPost.id);
    try {
      await updateDoc(postRef, { ...editedPost, updatedAt: serverTimestamp() });
      setPosts(prevPosts => prevPosts.map(post => post.id === editedPost.id ? editedPost : post));
      setIsEditPostModalOpen(false);
      setEditPost(null);
    } catch (error) {
      console.error('포스트 수정 중 오류 발생:', error);
      alert('포스트 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePost = async (post) => {
    try {
      await deleteDoc(doc(db, "Posts", post.id));
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('포스트 삭제 중 오류가 발생했습니다.');
    }
  };

  const onSendMessage = async () => {
    if (!currentMessage) return;

    const newMessage = {
      role: 'user',
      content: currentMessage
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    const postJson = posts.map(post => ({
      author: post.author,
      text: post.text
    }));

    try {
      const response = await axios.post(API_URL, {
        posts: postJson,
        message: currentMessage,
        userId: auth.currentUser?.uid,
        teacherId: studentSession?.teacherId
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.evaluation
      };

      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Backend API Error:', error);
      
      let errorMessage = "AI가 힘들어하고 있어요. 질문을 간결하게 작성해 주세요.";
      
      if (error.response && error.response.status === 500) {
        // 500 오류일 경우 사용자 친화적인 메시지 표시
        const aiErrorMessage = {
          role: 'assistant',
          content: errorMessage
        };
        setMessages(prevMessages => [...prevMessages, aiErrorMessage]);
      } else {
        // 다른 오류의 경우 기존 오류 메시지 표시
        alert(`Backend API 호출 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const canvasStyle = {
    background: '#f0f0f0', // 은은한 회색 배경
  };

  return (
    <div className="mt-20 flex flex-col items-center w-full h-full">
      <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">✨ 아이디어 캔버스 AI</h1>
      <div className="text-sm font-normal text-center mb-4 text-gray-400">ChatGPT-4o 기반</div>
      <div className="relative w-full h-full flex justify-center items-start mt-6">
        <div className="min-h-60vh relative rounded-lg shadow-lg border border-gray-300 flex flex-wrap content-start p-6"
             style={{ ...canvasStyle, width: 'calc(100% - 80px)', height: '100%', overflow: 'auto' }}>
          {posts.map((post, index) => (
            <Post key={index} post={post} onEdit={handleEditPost} />
          ))}
        </div>
        <div className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-4 bg-white p-3 rounded-lg shadow-md"
             style={{ right: '-35px' }}>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="text-gray-600 p-2 rounded-full hover:bg-gray-100 transition duration-300"
            title="포스트 추가"
          >
            <FaPlus />
          </button>
          <button
            onClick={fetchPosts}
            className={`text-gray-600 p-2 rounded-full hover:bg-gray-100 transition duration-300 ${isLoading ? 'animate-spin' : ''}`}
            title="새로고침"
            disabled={isLoading}
          >
            <FaSync />
          </button>
          {!studentSession && (
            <button
              onClick={() => setIsChatPromptOpen(!isChatPromptOpen)}
              className="text-gray-600 p-2 rounded-full hover:bg-gray-100 transition duration-300"
              title="AI Chat"
            >
              <FaComments />
            </button>
          )}
        </div>
      </div>

      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSave={handleAddPost}
      />

      <PostModal
        isOpen={isEditPostModalOpen}
        onClose={() => {
          setIsEditPostModalOpen(false);
          setEditPost(null);
        }}
        onSave={handleSaveEditedPost}
        onDelete={handleDeletePost}
        initialPost={editPost}
        isEditing={true}
      />

      {!studentSession && (
        <ChatPrompt
          isOpen={isChatPromptOpen}
          onClose={() => setIsChatPromptOpen(false)}
          onSendMessage={onSendMessage}
          messages={messages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default IdeaCanvasAI;