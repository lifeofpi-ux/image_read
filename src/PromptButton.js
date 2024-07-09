import React from 'react';

const PromptButton = ({ prompt, onClick }) => {
  if (!prompt) return null;

  return (
    <button
      onClick={() => onClick(prompt)}
      className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg px-6 py-3 hover:from-blue-500 hover:to-indigo-600 transition duration-300 text-left overflow-hidden text-ellipsis whitespace-nowrap w-full shadow-md"
    >
      {prompt.title.length > 50 ? prompt.title.substring(0, 50) + '...' : prompt.title}
    </button>
  );
};

export default PromptButton;