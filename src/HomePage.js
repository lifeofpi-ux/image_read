import React, { useEffect, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';

import { db } from './firebase';

const HomePage = ({ 

  user, 

  studentSession,

  setIsLoginModalOpen, 

  setIsModalOpen, 

  setIsStudentLoginModalOpen,

  setShowLoginSuccess,

  setLoginSuccessInfo,

  setRedirectPath

}) => {

  const navigate = useNavigate();

  const [isLoginConfirmModalOpen, setIsLoginConfirmModalOpen] = useState(false);

  const [selectedPath, setSelectedPath] = useState('');

  const [adminKeyAllowed, setAdminKeyAllowed] = useState(null);

  useEffect(() => {

    if ((user || studentSession) && typeof setShowLoginSuccess === 'function') {

      setShowLoginSuccess(false);

    }

  }, [user, studentSession, setShowLoginSuccess]);

  useEffect(() => {

    if ((user || studentSession) && selectedPath) {

      navigate(selectedPath);

      setSelectedPath('');

    }

  }, [user, studentSession, selectedPath, navigate]);

  const handleCardClick = (path) => {

    if (user || studentSession) {

      navigate(path);

    } else {

      setSelectedPath(path);

      setIsLoginConfirmModalOpen(true);

    }

  };

  const handleLoginSelection = (isTeacher) => {

    setIsLoginConfirmModalOpen(false);

    if (isTeacher) {

      setIsLoginModalOpen(true);

    } else {

      setIsStudentLoginModalOpen(true);

    }

    setRedirectPath(selectedPath);

    setLoginSuccessInfo(prev => ({ ...prev, redirectPath: selectedPath }));

  };

  const LoginConfirmModal = () => (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-xs w-full">

        <h2 className="text-xl font-bold mb-3 text-center text-gray-800">로그인 필요</h2>

        <p className="mb-5 text-center text-sm text-gray-600">로그인 후 이용하실 수 있습니다.</p>

        <div className="flex flex-col space-y-2">

          <button 

            onClick={() => handleLoginSelection(true)}

            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"

          >

            👩🏻‍🏫 선생님 로그인

          </button>

          <button 

            onClick={() => handleLoginSelection(false)}

            className="w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow-md hover:from-pink-600 hover:to-pink-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"

          >

            👩🏻‍💻 학생 로그인

          </button>

        </div>

        <button 

          onClick={() => setIsLoginConfirmModalOpen(false)}

          className="mt-5 w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out"

        >

          닫기

        </button>

      </div>

    </div>

  );

  const checkAdminKeyStatus = useCallback(async () => {

    try {

      const adminDocRef = doc(db, "users", process.env.REACT_APP_ADMIN_EMAIL);

      const adminDoc = await getDoc(adminDocRef);

      const allowDefaultKey = adminDoc.exists() && adminDoc.data().allowDefaultKey;

      setAdminKeyAllowed(allowDefaultKey);

      console.log('🔑 관리자 키 사용 허용 상태 (HomePage):', allowDefaultKey);

    } catch (error) {

      console.error("Error checking admin key status:", error);

      setAdminKeyAllowed(false);

    }

  }, []);

  useEffect(() => {

    checkAdminKeyStatus();

  }, [checkAdminKeyStatus]);

  const MiniPopup = ({ isVisible, onClose }) => {

    if (!isVisible) return null;



    const blinkAnimation = `

      @keyframes blink {

        0% { opacity: 1; }

        50% { opacity: 0.5; }

        100% { opacity: 1; }

      }

    `;



    const popupStyle = {

      position: 'fixed',

      top: '10px',

      right: '50px',

      animation: 'blink 2s linear infinite'

    };



    return (

      <>

        <style>{blinkAnimation}</style>

        <div 

          className="px-2 mt-2 mr-2 bg-black text-white text-sm rounded p-2 z-10 shadow-lg"

          style={popupStyle}

        >

          <span>❤️ 평가 프롬프트 설정</span>

          <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-200">

            &times;

          </button>

        </div>

      </>

    );

  };

  return (

    <div className="flex flex-col items-center justify-center min-h-custom">

      <h1 className="text-4xl font-bold mb-1 text-gray-800">T.R.I.P.O.D.</h1>

      <h1 className="text-sm font-bold mb-20 text-gray-400">수업, 평가, 교육 그리고 사람들</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl w-300 px-4 mb-20">

        <div 

          onClick={() => handleCardClick("/rubric-report")}

          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"

        >

          <div className="bg-blue-500 p-4">

            <div className="text-white text-2xl mb-2">📝</div>

          </div>

          <div className="p-4">

            <h3 className="text-lg font-semibold text-gray-800 mb-2">루브릭 레포트 AI</h3>

            <p className="text-sm text-gray-600">AI를 활용한 루브릭 기반 평가 리포트 생성</p>

          </div>

        </div>

        <div 

          onClick={() => handleCardClick("/image-analysis")}

          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"

        >

          <div className="bg-green-500 p-4">

            <div className="text-white text-2xl mb-2">🏠</div>

          </div>

          <div className="p-4">

            <h3 className="text-lg font-semibold text-gray-800 mb-2">이미지 평가 AI</h3>

            <p className="text-sm text-gray-600">AI를 이용한 이미지 기반 학습 결과물 분석</p>

          </div>

        </div>

        <div 

          onClick={() => handleCardClick("/conv-ai")}

          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"

        >

          <div className="bg-purple-500 p-4">

            <div className="text-white text-2xl mb-2">💬</div>

          </div>

          <div className="p-4">

            <h3 className="text-lg font-semibold text-gray-800 mb-2">AI 채팅 도우미</h3>

            <p className="text-sm text-gray-600">AI와의 대화를 통한 학습 지원 및 질문 해결</p>

          </div>

        </div>

        <div 

          onClick={() => handleCardClick("/idea-canvas")}

          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"

        >

          <div className="bg-pink-500 p-4">

            <div className="text-white text-2xl mb-2">🖌️</div>

          </div>

          <div className="p-4">

            <h3 className="text-lg font-semibold text-gray-800 mb-2">아이디어 캔버스 AI</h3>

            <p className="text-sm text-gray-600">AI Prompt를 활용한 포스트 아이디어 평가</p>

          </div>

        </div>

        <div 

          onClick={() => handleCardClick("/tpack-lesson")}

          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"

        >

          <div className="bg-[#ffdf14] p-4">

            <div className="text-white text-2xl mb-2">📚</div>

          </div>

          <div className="p-4">

            <h3 className="text-lg font-semibold text-gray-800 mb-2">TPACK 교수학습 설계</h3>

            <p className="text-sm text-gray-600">TPACK 모델을 활용한 교수학습 설계 도구</p>

          </div>

        </div>

        <div 

          onClick={() => handleCardClick("/student-evaluation")}

          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"

        >

          <div className="bg-[#ff7070] p-4">

            <div className="text-white text-2xl mb-2">📊</div>

          </div>

          <div className="p-4">

            <h3 className="text-lg font-semibold text-gray-800 mb-2">학생 성적 평가 도구</h3>

            <p className="text-sm text-gray-600">AI를 활용한 학생 성적 평가 및 피드백 생성</p>

          </div>

        </div>

      </div>

      <div className="max-w-xl w-full mt-8 mb-20 text-center">

        <div className={`text-sm font-medium ${

          adminKeyAllowed ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'

        } p-2 rounded-lg border ${

          adminKeyAllowed ? 'border-green-200' : 'border-red-200'

        } shadow-sm`}>

          *AI 도구 모드 👉 {

            adminKeyAllowed 

              ? '시스템 AI API Key를 활용할 수 있습니다.' 

              : '시스템 AI API Key를 활용할 수 없습니다. 개인 키를 추가해주세요.'

          }

        </div>

      </div>

      <div className="absolute bottom-5 text-center text-sm text-gray-400 w-full">

        <div className="flex justify-center items-center space-x-6">

          <a 

            href="https://slashpage.com/tripod/about" 

            target="_blank" 

            rel="noopener noreferrer"

            className="hover:text-gray-600 transition duration-300 text-bold"

          >

            2024. T.R.I.P.O.D. 수업 혁신 연구회

          </a>

          <button 

            onClick={() => setIsModalOpen(true)}

            className="hover:text-gray-600 transition duration-300"

          >

            만든 사람

          </button>

        </div>

      </div>

      {isLoginConfirmModalOpen && <LoginConfirmModal />}

      <MiniPopup isVisible={true} onClose={() => {}} />

    </div>

  );

};

export default HomePage;


