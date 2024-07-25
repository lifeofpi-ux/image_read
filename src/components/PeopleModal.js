import React from 'react';

const PeopleModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4">😉 만든 사람들</h2>
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <p className="mb-2">대구대남초 김상섭</p>
          <p className="mb-2">대전장대초 김진관</p>
          <p className="mb-2">인천동암초 윤신영</p>
          <p className="mb-2">서울미림마이스터고 이대형</p>
          <p>서울숭곡초 이상선</p>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeopleModal;