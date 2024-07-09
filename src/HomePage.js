import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import Cookies from 'js-cookie';
import { auth } from './firebase';

const HomePage = ({ 
  user, 
  studentSession,
  setIsLoginModalOpen, 
  setIsModalOpen, 
  setIsStudentLoginModalOpen,
  setShowLoginSuccess,
  setLoginSuccessInfo
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if ((user || studentSession) && typeof setShowLoginSuccess === 'function') {
      setShowLoginSuccess(false);
    }
  }, [user, studentSession, setShowLoginSuccess]);

  const handleLogout = async () => {
    try {
      if (user) {
        await signOut(auth);
      } else if (studentSession) {
        Cookies.remove('studentSession');
      }
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  const handleNavigation = (path) => {
    (user || studentSession) ? navigate(path) : setIsLoginModalOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-custom">
      <h1 className="text-4xl font-bold mb-1 text-gray-800">T.R.I.P.O.D.</h1>
      <h1 className="text-sm font-bold mb-20 text-gray-400">수업, 평가, 교육 그리고 사람들</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-xl w-300 px-4 mb-20">
        <div 
          onClick={() => handleNavigation("/rubric-report")}
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
          onClick={() => handleNavigation("/image-analysis")}
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
          onClick={() => handleNavigation("/conv-ai")}
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
      </div>

      {user || studentSession ? (
        <div className="w-200 max-w-xl px-4">
          <button 
            onClick={handleLogout}
            className="min-w-[200px] text-lg px-6 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition duration-300 text-center font-semibold"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div className="w-[400px] max-w-4xl px-4 flex space-x-4">
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="flex-1 px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-lg hover:bg-indigo-600 transition duration-300 text-center font-semibold"
          >
            👩🏻‍🏫 선생님
          </button>
          <button 
            onClick={() => setIsStudentLoginModalOpen(true)}
            className="flex-1 px-6 py-2 bg-purple-500 text-white rounded-lg shadow-lg hover:bg-purple-600 transition duration-300 text-center font-semibold"
          >
            👩🏻‍💻 학생
          </button>
        </div>
      )}

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
    </div>
  );
};

export default HomePage;