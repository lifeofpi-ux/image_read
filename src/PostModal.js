import React, { useState, useEffect } from 'react';
import { auth } from './firebase'; // auth를 가져오기

const PostModal = React.memo(({ isOpen, onClose, onSave, onDelete, initialPost = null, isEditing = false }) => {
  const [post, setPost] = useState(() => initialPost || { text: '', author: '' });
  const [password, setPassword] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialPost) {
        setPost(initialPost);
      } else {
        setPost({ text: '', author: '' });
      }
      setPassword('');
    }
  }, [isOpen, isEditing, initialPost]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPost(prevPost => ({ ...prevPost, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user && !password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    onSave({ ...post, password });
    onClose();
  };

  const handleDelete = () => {
    if (!user && !password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    onDelete({ ...post, password });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg max-w-xl w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{isEditing ? '포스트 수정' : '새 포스트 추가'}</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="author">
              작성자
            </label>
            <input
              id="author"
              name="author"
              type="text"
              value={post.author}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="text">
              텍스트
            </label>
            <textarea
              id="text"
              name="text"
              value={post.text}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            />
          </div>
    
          {!user && (
            <div className="mb-4">
              <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          )}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600 transition duration-300"
            >
              취소
            </button>
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600 transition duration-300"
                >
                  삭제
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                {isEditing ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

export default PostModal;
