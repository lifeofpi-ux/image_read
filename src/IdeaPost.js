import React from 'react';

const IdeaPost = ({ idea }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-bold">{idea.author}</h3>
      <p>{idea.text}</p>
    </div>
  );
};

export default IdeaPost;