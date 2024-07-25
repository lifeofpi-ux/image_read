import React, { useState, useEffect } from 'react';

const EditRowModal = ({ isOpen, onClose, onSave, onDelete, row }) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (row) {
      setDescription(row.description);
    }
  }, [row]);

  const handleSave = () => {
    onSave(row.id, description);
    onClose();
  };

  if (!isOpen || !row) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">학습 절차 편집</h2>
        <div className="mb-6">
          <label htmlFor="rowDescription" className="block text-sm font-medium text-gray-700 mb-2">
            학습 절차 설명
          </label>
          <textarea
            id="rowDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="학습 절차 설명을 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          ></textarea>
        </div>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
          >
            저장
          </button>
          <button
            onClick={() => onDelete(row.id)}
            disabled={row.number === 1}
            className={`px-4 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-300 ${
              row.number === 1
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
            }`}
          >
            수업흐름 삭제
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRowModal;