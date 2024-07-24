import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDoc, serverTimestamp, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where, limit } from 'firebase/firestore';
import { db, auth } from './firebase';
import Cookies from 'js-cookie';
import axios from 'axios';
import './App.css';
import './custom.css';
import PostModal from './PostModal';

const API_URL = '/api/analyze-ideas';
const OPENAI_API_URL = 'https://api.openai.com/v1/engines/davinci-codex/completions'; // OpenAI API URL
const OPENAI_API_KEY = 'your_openai_api_key'; // OpenAI API Key

const Post = ({ post, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const user = auth.currentUser;
  const studentSession = JSON.parse(Cookies.get('studentSession') || '{}');
  const teacherId = studentSession?.teacherId || user?.uid;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div
      className="relative bg-yellow-100 text-gray-800 rounded-lg p-4 m-2 shadow-md flex-shrink-0"
      style={{ width: '200px', height: '200px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      
      <p className="text-sm text-gray-600 mb-3 font-bold">{post.author}</p>
      <p>{post.text}</p>
      {isHovered && (user || teacherId === post.teacherId) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <button
            onClick={() => onEdit(post)}
            className="bg-blue-500 text-white text-sm px-4 py-2 rounded-full"
          >
            수정
          </button>
        </div>
      )}
    </div>
  );
};

const RubricModal = ({ isOpen, onClose, onSave, onDelete, onApply, initialRubric }) => {
  const [rubric, setRubric] = useState(initialRubric || {
    id: '',
    summary: '',
    acnum: '',
    rubric: '',
    high: '',
    mid: '',
    low: ''
  });

  useEffect(() => {
    if (initialRubric) {
      setRubric(initialRubric);
    } else {
      setRubric({
        id: '',
        summary: '',
        acnum: '',
        rubric: '',
        high: '',
        mid: '',
        low: ''
      });
    }
  }, [initialRubric]);

  const handleChange = (e) => {
    setRubric({ ...rubric, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(rubric);
  };

  if (!isOpen) return null;

  const fieldOrder = ['summary', 'acnum', 'rubric', 'high', 'mid', 'low'];
  const fieldLabels = {
    summary: '🪴 평가 주제',
    acnum: '🧩 성취기준',
    rubric: '📝 평가 프롬프트',
    high: '😀 우수',
    mid: '😊 보통',
    low: '😀 노력요함'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4">📝 루브릭 내용</h2>
        <form onSubmit={handleSubmit}>
          {fieldOrder.map((key) => (
            <div key={key} className="mb-4">
              <label className="block text-gray-700 text-base font-bold mb-2" htmlFor={key}>
                {fieldLabels[key]}
              </label>
              <textarea
                id={key}
                name={key}
                value={rubric[key]}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="2"
              />
            </div>
          ))}
          <div className="flex justify-between items-center mt-6">
            <div>
              {onDelete && rubric.id && (
                <button
                  type="button"
                  onClick={() => onDelete(rubric.id)}
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
                onClick={() => onApply(rubric)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 mr-2"
              >
                프롬프트 적용
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                {rubric.id ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </form>
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
        <style>{`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
        <span>❤️ 평가 프롬프트 설정</span>
        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-200">
          &times;
        </button>
      </div>
    );
  };

const RubricDetailModal = ({ isOpen, onClose, rubric }) => {
  if (!isOpen || !rubric) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-xl w-full shadow-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">🏷️ 루브릭 상세 정보</h2>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">🪴 평가 주제</h3>
          <p className="ml-6" >{rubric.summary}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">🧩 성취기준</h3>
          <p className="ml-6">{rubric.acnum}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">📝 평가 프롬프트</h3>
          <p className="ml-6">{rubric.rubric}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">😀우수</h3>
          <p className="ml-6">{rubric.high}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">😊보통</h3>
          <p className="ml-6">{rubric.mid}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">😀노력요함</h3>
          <p className="ml-6">{rubric.low}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          닫기
        </button>
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
          className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

const IdeaCanvasAI = () => {
  const [posts, setPosts] = useState([]);
  const [currentRubric, setCurrentRubric] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [isRightSideTabOpen, setIsRightSideTabOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(true);
  const [isRubricDetailModalOpen, setIsRubricDetailModalOpen] = useState(false);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [studentSession] = useState(() => {
    const sessionData = Cookies.get('studentSession');
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const fetchRubrics = useCallback(async () => {
    const user = auth.currentUser;
    const session = studentSession;
    if (!user && !session) return;

    const rubricsRef = collection(db, "idRubric");
    const q = query(
      rubricsRef, 
      where("userId", "==", user ? user.uid : session.teacherId), 
      orderBy("createdAt", "desc"), 
      limit(5)
    );
    const querySnapshot = await getDocs(q);
    const rubricList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRubrics(rubricList);
    if (rubricList.length > 0 && !currentRubric) {
      setCurrentRubric(rubricList[0]);
    }
  }, [currentRubric, studentSession]);

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
    fetchRubrics();
    fetchPosts();
  }, [fetchRubrics, fetchPosts]);

  const analyzeIdeas = async () => {
    if (!currentRubric) {
      alert('먼저 루브릭을 선택해주세요.');
      return;
    }

    const user = auth.currentUser;
    const session = studentSession || {};

    if (!user && !session.teacherId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        posts,
        rubric: currentRubric,
        userId: user ? user.uid : null,
        teacherId: session.teacherId
      });

      const { evaluations, result } = response.data;
      setPosts(evaluations);
      setAnalysisResult(result);
      setIsNotificationOpen(true); // Show the modal with the result
    } catch (error) {
      console.error('오류:', error);
      alert(`아이디어 분석 중 오류가 발생했습니다. ${error.message}`);
    }
  };

  const handleSaveRubric = async (newRubric) => {
    const user = auth.currentUser;
    const session = studentSession || {};
    const teacherId = session.teacherId || user?.uid;

    if (!teacherId) {
      console.error("User not authenticated");
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      let savedRubric;
      if (newRubric.id) {
        // Update existing rubric
        const rubricRef = doc(db, "idRubric", newRubric.id);
        await updateDoc(rubricRef, {
          ...newRubric,
          updatedAt: serverTimestamp()
        });
        savedRubric = { ...newRubric, id: newRubric.id };
      } else {
        // Add new rubric
        const docRef = await addDoc(collection(db, "idRubric"), {
          ...newRubric,
          userId: teacherId,
          createdAt: serverTimestamp()
        });
        savedRubric = { ...newRubric, id: docRef.id };
      }

      setIsRubricModalOpen(false);
      setSelectedRubric(null);

      // 상태 업데이트
      setRubrics(prevRubrics => {
        const updatedRubrics = prevRubrics.filter(r => r.id !== savedRubric.id);
        return [savedRubric, ...updatedRubrics];
      });

      // 현재 루브릭 업데이트
      if (currentRubric && currentRubric.id === savedRubric.id) {
        setCurrentRubric(savedRubric);
      }

      setIsNotificationOpen(true);
    } catch (error) {
      console.error("Error in handleSaveRubric:", error);
      if (error.code) {
        console.error("Firebase error code:", error.code);
      }
      alert(`루브릭 저장/업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleDeleteRubric = async (rubricId) => {
    const user = auth.currentUser;
    const session = studentSession;
    if (!user && !session) return;

    if (window.confirm('이 루브릭을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, "idRubric", rubricId));
        setIsRubricModalOpen(false);
        setIsNotificationOpen(true);
        if (currentRubric && currentRubric.id === rubricId) {
          setCurrentRubric(null);
        }
        fetchRubrics();
      } catch (error) {
        console.error("Error deleting rubric: ", error);
        alert('루브릭 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditRubric = (rubric) => {
    setSelectedRubric(rubric);
    setIsRubricModalOpen(true);
  };

  const handleApplyRubric = (rubric) => {
    setCurrentRubric(rubric);
    setIsRubricModalOpen(false);
  };

  const handleAddPost = async (post) => {
    const newPost = {
      ...post,
      createdAt: serverTimestamp(),
      teacherId: auth.currentUser?.uid || studentSession?.teacherId,
    };
    try {
      const docRef = await addDoc(collection(db, "Posts"), newPost);
      setPosts([...posts, { ...newPost, id: docRef.id }]);
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
      const postDoc = await getDoc(postRef);
      const post = postDoc.data();
  
      // 비밀번호 검증 로직 추가
      const user = auth.currentUser;
      const session = studentSession;
      const isPasswordMatch = user || (session?.password === editedPost.password) || (post.password === editedPost.password);
      if (!isPasswordMatch) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
  
      await updateDoc(postRef, { ...editedPost, updatedAt: serverTimestamp() });
      setPosts(posts.map(p => p.id === editedPost.id ? editedPost : p));
      setIsEditPostModalOpen(false);
      setEditPost(null);
    } catch (error) {
      console.error('포스트 수정 중 오류 발생:', error);
      alert('포스트 수정 중 오류가 발생했습니다.');
    }
  };
  
  

  const handleDeletePost = async (post) => {
    const user = auth.currentUser;
    const session = studentSession;
  
    if (!user && !post.password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
  
    try {
      const postRef = doc(db, "Posts", post.id);
      if (!user) {
        const postDoc = await getDoc(postRef);
        const existingPost = postDoc.data();
  
        const isPasswordMatch = (session?.password === post.password) || (existingPost.password === post.password);
        if (!isPasswordMatch) {
          alert('비밀번호가 일치하지 않습니다.');
          return;
        }
      }
  
      await deleteDoc(postRef);
      setPosts(posts.filter(p => p.id !== post.id));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('포스트 삭제 중 오류가 발생했습니다.');
    }
  };
  

  const exportPostsToJson = async () => {
    const postJson = posts.map(post => ({
      author: post.author,
      text: post.text
    }));
    console.log(JSON.stringify(postJson, null, 2));
    
    try {
      const response = await axios.post(OPENAI_API_URL, {
        prompt: `Evaluate these posts based on the following rubric:\n${JSON.stringify(currentRubric)}\nPosts:\n${JSON.stringify(postJson, null, 2)}`,
        max_tokens: 1000,
        n: 1,
        stop: null,
        temperature: 0.7
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });

      console.log('OpenAI API Response:', response.data);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      alert(`OpenAI API 호출 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">✨ 아이디어 캔버스 AI</h1>
      <div className="text-sm font-normal text-center mb-4 text-gray-400">ChatGPT-4 기반</div>
      {currentRubric && (
        <div className="absolute top-0 left-0 mt-4 ml-4 bg-gray-200 text-gray-700 rounded-lg px-3 py-1 shadow-md">
          평가 주제: {currentRubric.summary}
        </div>
      )}
      <div className="relative w-full h-full flex justify-center items-start mt-6">
        {/* 캔버스 영역 */}
        <div className="relative bg-gray-50 p-6 rounded-lg shadow-lg border border-gray-300 flex flex-wrap content-start" style={{ width: '100%', height: '100%', minHeight: '600px', background: '#f0f0f0', overflow: 'auto' }}>
          {posts.map((post, index) => (
            <Post key={index} post={post} onEdit={handleEditPost} />
          ))}
        </div>

        {/* 우측 원형 버튼 */}
        <div className="flex flex-col items-center ml-4 space-y-4">
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="relative bg-green-500 text-white p-4 rounded-full shadow-md hover:bg-green-600 transition duration-300"
          >
            +
            <span className="absolute top-0 left-12 w-32 bg-black text-white text-xs rounded-md py-1 px-2 opacity-0 hover:opacity-100">포스트 추가</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="relative bg-gray-500 text-white p-4 rounded-full shadow-md hover:bg-gray-600 transition duration-300"
          >
            ⟳
            <span className="absolute top-0 left-12 w-32 bg-black text-white text-xs rounded-md py-1 px-2 opacity-0 hover:opacity-100">새로고침</span>
          </button>
          {auth.currentUser && (
            <>
              <button
                onClick={analyzeIdeas}
                className="relative bg-blue-500 text-white p-4 rounded-full shadow-md hover:bg-blue-600 transition duration-300"
              >
                ✔
                <span className="absolute top-0 left-12 w-32 bg-black text-white text-xs rounded-md py-1 px-2 opacity-0 hover:opacity-100">평가하기</span>
              </button>
              <button
                onClick={exportPostsToJson}
                className="relative bg-yellow-500 text-white p-4 rounded-full shadow-md hover:bg-yellow-600 transition duration-300"
              >
                📄
                <span className="absolute top-0 left-12 w-32 bg-black text-white text-xs rounded-md py-1 px-2 opacity-0 hover:opacity-100">JSON 출력</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right side tab */}
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
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🛠️ 루브릭 설정</h2>
            <button
              onClick={() => {
                setSelectedRubric({
                  summary: '',
                  acnum: '',
                  rubric: '',
                  high: '',
                  mid: '',
                  low: ''
                });
                setIsRubricModalOpen(true);
              }}
              className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col space-y-3">
            {rubrics.map((rubric) => (
              <button
                key={rubric.id}
                onClick={() => handleEditRubric(rubric)}
                className={`relative bg-gradient-to-r ${
                  currentRubric && currentRubric.id === rubric.id
                    ? 'from-green-500 to-teal-600'
                    : 'from-blue-500 to-purple-500'
                } text-white rounded-lg px-4 py-3 hover:from-blue-600 hover:to-purple-600 transition duration-300 text-left overflow-hidden shadow-md`}
              >
                {currentRubric && currentRubric.id === rubric.id && (
                  <div className="absolute top-6 right-1 transform -translate-x-1/4 -translate-y-4">
                    <div className="bg-white rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="green">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                <p className="text-base text-base text-white-900 truncate mb-1">{rubric.summary}</p>
                <p className="text-xs text-gray-200">{rubric.rubric}</p>
              </button>
            ))}
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

      <RubricModal
        isOpen={isRubricModalOpen}
        onClose={() => {
          setIsRubricModalOpen(false);
          setSelectedRubric(null);
        }}
        onSave={handleSaveRubric}
        onDelete={handleDeleteRubric}
        onApply={handleApplyRubric}
        initialRubric={selectedRubric}
      />

      <RubricDetailModal
        isOpen={isRubricDetailModalOpen}
        onClose={() => setIsRubricDetailModalOpen(false)}
        rubric={currentRubric}
      />

      <NotificationModal
        isOpen={isNotificationOpen}
        message={analysisResult}
        onClose={() => setIsNotificationOpen(false)}
      />
    </div>
  );
};

export default IdeaCanvasAI;
