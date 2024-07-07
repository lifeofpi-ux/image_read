import React from 'react';

const LoginSuccessModal = ({ onClose, userType, nickname }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl text-center font-bold mb-4">로그인 성공</h2>
        <p className="mb-4">
          {userType === 'teacher' 
            ? `${nickname}, 환영합니다!` 
            : `${nickname} 선생님의 학생으로 로그인되었습니다.`}
        </p>
        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default LoginSuccessModal;