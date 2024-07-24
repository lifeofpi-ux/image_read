import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
          onClick={() => handleCardClick("/student-evaluation")}
          className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"
        >
          <div className="bg-red-500 p-4">
            <div className="text-white text-2xl mb-2">📊</div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">학생 성적 평가 도구</h3>
            <p className="text-sm text-gray-600">AI를 활용한 학생 성적 평가 및 피드백 생성</p>
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
    </div>
  );
};

export default HomePage;
