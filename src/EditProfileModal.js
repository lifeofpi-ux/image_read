import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';

function EditProfileModal({ user, onClose, onUpdate }) {
  const [nickname, setNickname] = useState(user.nickname || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Update displayName in Firebase Auth
      await updateProfile(auth.currentUser, { displayName: nickname });

      // Update nickname in Firestore
      await updateDoc(doc(db, "users", user.uid), { nickname: nickname });

      const updatedUser = { ...user, nickname: nickname };
      onUpdate(updatedUser);
      onClose();
    } catch (error) {
      console.error("Profile update error:", error);
      setError("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">프로필 수정</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">닉네임</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '업데이트 중...' : '수정'}
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default EditProfileModal;