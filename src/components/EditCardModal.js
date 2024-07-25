import React, { useState, useEffect } from 'react';

const EditCardModal = ({ isOpen, onClose, onSave, onDelete, card }) => {
  const [cardText, setCardText] = useState('');
  const [cardColor, setCardColor] = useState('');

  useEffect(() => {
    if (card) {
      setCardText(card.text);
      setCardColor(card.color);
    }
  }, [card]);

  const handleSave = () => {
    onSave(card.id, {
      text: cardText,
      color: cardColor,
      label: getLabel(cardColor)
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(card.id);
    onClose(); // 삭제 후 모달 닫기
  };

  const getLabel = (color) => {
    switch(color) {
      case "pink": return "테크놀로지 지식(TK)";
      case "lightyellow": return "교수지식(PK)";
      case "lightgreen": return "내용지식(CK)";
      case "lightpurple": return "테크교수내용지식(TPACK)";
      case "lightblue": return "테크놀로지 교수지식(TPK)";
      case "lightorange": return "테크놀로지 내용지식(TCK)";
      case "lightred": return "교수 내용지식(PCK)";
      default: return "";
    }
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">카드 편집</h2>
        <div className="mb-4">
          <label htmlFor="editCardText" className="block text-sm font-medium text-gray-700 mb-2">
            카드 내용
          </label>
          <input
            type="text"
            id="editCardText"
            value={cardText}
            onChange={(e) => setCardText(e.target.value)}
            placeholder="카드 내용을 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="editCardColor" className="block text-sm font-medium text-gray-700 mb-2">
            TPACK 요소카드
          </label>
          <select
            id="editCardColor"
            value={cardColor}
            onChange={(e) => setCardColor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pink">테크놀로지 지식(TK)</option>
            <option value="lightyellow">교수지식(PK)</option>
            <option value="lightgreen">내용지식(CK)</option>
            <option value="lightpurple">테크교수내용지식(TPACK)</option>
            <option value="lightblue">테크놀로지 교수지식(TPK)</option>
            <option value="lightorange">테크놀로지 내용지식(TCK)</option>
            <option value="lightred">교수 내용지식(PCK)</option>
          </select>
        </div>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
          >
            저장
          </button>
          <button 
            onClick={handleDelete} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300"
          >
            카드 삭제
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

export default EditCardModal;