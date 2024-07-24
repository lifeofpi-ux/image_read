import React, { useState, useEffect } from 'react';

const RubricModal = ({ isOpen, onClose, onSave, onDelete, onApply, initialRubric }) => {
  const [rubric, setRubric] = useState(initialRubric || {});

  useEffect(() => {
    setRubric(initialRubric || {});
  }, [initialRubric]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Edit Rubric</h2>
        {/* Add form fields for rubric editing here */}
        <div className="flex justify-between mt-4">
          <button onClick={() => onDelete(rubric.id)} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
          <button onClick={() => onApply(rubric)} className="bg-green-500 text-white px-4 py-2 rounded">Apply</button>
          <button onClick={() => onSave(rubric)} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
        </div>
        <button onClick={onClose} className="mt-4 bg-gray-300 text-black px-4 py-2 rounded w-full">Close</button>
      </div>
    </div>
  );
};

export default RubricModal;