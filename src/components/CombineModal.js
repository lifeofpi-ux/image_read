import React, { useState, useEffect } from 'react';

const CombineModal = ({ isOpen, onClose, selectedCards, onCombine }) => {
  const [combineActivity, setCombineActivity] = useState('');

  useEffect(() => {
    if (selectedCards.length > 0) {
      setCombineActivity(selectedCards.map(card => card.text).join(' + '));
    }
  }, [selectedCards]);

  const handleCombine = () => {
    const cardTypes = selectedCards.map(card => card.label);
    let newCardLabel = '';
    let newCardColor = '';
  
    if (cardTypes.includes('테크놀로지 지식(TK)') && cardTypes.includes('교수지식(PK)') && cardTypes.includes('내용지식(CK)')) {
      newCardLabel = '테크교수내용지식(TPACK)';
      newCardColor = 'lightpurple';
    } else if (cardTypes.includes('테크놀로지 지식(TK)') && cardTypes.includes('교수지식(PK)')) {
      newCardLabel = '테크놀로지 교수지식(TPK)';
      newCardColor = 'lightblue';
    } else if (cardTypes.includes('테크놀로지 지식(TK)') && cardTypes.includes('내용지식(CK)')) {
      newCardLabel = '테크놀로지 내용지식(TCK)';
      newCardColor = 'lightorange';
    } else if (cardTypes.includes('교수지식(PK)') && cardTypes.includes('내용지식(CK)')) {
      newCardLabel = '교수 내용지식(PCK)';
      newCardColor = 'lightred';
    } else {
      alert("기본 지식끼리 조합해주세요.");
      return;
    }
  
    onCombine({
      text: combineActivity,
      color: newCardColor,
      label: newCardLabel,
      rowId: selectedCards[0].rowId
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">✨지식 결합</h2>
        <div className="mb-4">
          <div className="font-medium text-gray-700">
            {selectedCards.map(card => card.label).join(' + ')}
          </div>
        </div>
        <div className="mb-6">
          <label htmlFor="combineActivity" className="block text-sm font-medium text-gray-700 mb-2">
            🤝🏻카드 조합 활동
          </label>
          <textarea
            id="combineActivity"
            value={combineActivity}
            onChange={(e) => setCombineActivity(e.target.value)}
            placeholder="카드 조합 활동을 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
          ></textarea>
        </div>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={handleCombine}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
          >
            카드 추가
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

export default CombineModal;