import React from 'react';

const ErrorModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">알림</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <button 
          onClick={onClose}
          className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;