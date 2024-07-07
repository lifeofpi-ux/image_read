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
    // 컴포넌트가 마운트될 때 로그인 상태 확인
    if ((user || studentSession) && typeof setShowLoginSuccess === 'function') {
      // 이미 로그인된 상태라면 로그인 성공 모달을 표시하지 않음
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
      // 로그아웃 후 필요한 상태 초기화
      navigate('/');
      window.location.reload(); // 페이지 새로고침
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-custom">
      <h1 className="text-4xl font-bold mb-1 text-gray-800">T.R.I.P.O.D.</h1>
      <h1 className="text-sm font-bold mb-10 text-gray-400">수업, 평가, 교육 그리고 사람들</h1>
      <div className="space-y-5">
        
        <button 
          onClick={() => (user || studentSession) ? navigate("/rubric-report") : setIsLoginModalOpen(true)}
          className="min-w-300 block px-11 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition duration-300 text-center text-lg font-semibold"
        >
          📝 루브릭 레포트 AI
        </button>
        <button
          onClick={() => (user || studentSession) ? navigate("/image-analysis") : setIsLoginModalOpen(true)}
          className="min-w-300 block px-11 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition duration-300 text-center text-lg font-semibold"
        >
          🏠 이미지 평가 AI
        </button>

        {user || studentSession ? (
          <div className="mb-5">
            <button 
              onClick={handleLogout}
              className="w-full text-lg px-6 py-2 mt-6 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition duration-300 text-center font-semibold"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex space-x-4 mb-5">
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 mt-6 w-full py-2 bg-indigo-500 text-white rounded-lg shadow-lg hover:bg-indigo-600 transition duration-300 text-center font-semibold"
            >
              👩🏻‍🏫 선생님
            </button>
            <button 
              onClick={() => setIsStudentLoginModalOpen(true)}
              className="px-6 mt-6 w-full py-2 bg-purple-500 text-white rounded-lg shadow-lg hover:bg-purple-600 transition duration-300 text-center font-semibold"
            >
              👩🏻‍💻 학생
            </button>
          </div>
        )}
      </div>
      <div className="absolute bottom-5 text-center text-sm text-gray-400 w-full">
        <div className="flex justify-center items-center space-x-6">
          <a 
            href="https://slashpage.com/tripod/about" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition duration-300 text-bold"
          >
            2024. T.R.I.P.O.D. 수업 혁신 연구회
          </a>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hover:text-gray-400 transition duration-300"
          >
            만든 사람
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
