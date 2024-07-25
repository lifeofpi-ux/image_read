import React from 'react';

const Card = ({ card, onEdit, onSelect, isSelected }) => {
  const showCheckbox = () => {
    document.querySelector(`#card-${card.id} .checkbox-container`).style.display = 'block';
  };

  const hideCheckbox = () => {
    document.querySelector(`#card-${card.id} .checkbox-container`).style.display = 'none';
  };

  return (
    <div
      id={`card-${card.id}`}
      className={`card ${card.color} ${isSelected ? 'selected' : ''}`}
      onMouseOver={showCheckbox}
      onMouseOut={hideCheckbox}
      draggable="true"
      onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
    >
      <div className="label">{card.label}</div>
      <div className="overlay">{card.text}</div>
      <div className="checkbox-container">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(card)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default Card;
