import React from 'react';

function LoginSuccessModal({ onClose, userType, nickname }) {
  let message;
  if (userType === 'logout') {
    message = '로그아웃 되었습니다.';
  } else {
    message =  `${userType === 'teacher' ? '선생님' : '선생님의 학생'}으로 로그인되었습니다.`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4 text-center">
          {userType === 'logout' ? '🖐️로그아웃' : '😀로그인'}
        </h2>
        <p className="text-center mb-6">{nickname} {message}</p>
      
        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default LoginSuccessModal;