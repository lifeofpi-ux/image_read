import React, { useState, useEffect } from 'react';

const EditCourseTitleModal = ({ isOpen, onClose, onSave, currentTitle }) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    setTitle(currentTitle);
  }, [currentTitle]);

  const handleSave = () => {
    onSave(title);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4">수업 제목 편집</h2>
        <div className="mb-4">
          <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-2">수업 제목</label>
          <input
            type="text"
            id="courseTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="수업 제목을 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            저장
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCourseTitleModal;