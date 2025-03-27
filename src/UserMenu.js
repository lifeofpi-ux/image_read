import React, { useState, useRef, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import LoginSuccessModal from './LoginSuccessModal';

const UserMenu = ({ user, studentSession, onLogout, onEditProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef(null);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showLogoutModal) {
      const timer = setTimeout(() => {
        setShowLogoutModal(false);
      }, 3000);  // 3초 후 자동으로 모달 닫기

      return () => clearTimeout(timer);
    }
  }, [showLogoutModal]);

  const handleLogout = async () => {
    await onLogout();
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  const displayName = user 
    ? `${user.nickname || user.displayName || '알 수 없음'} 선생님` 
    : studentSession
    ? `${studentSession.studentName || '학생'} (${studentSession.teacherNickname || '알 수 없음'} 학급)`
    : '알 수 없음';

  const userType = user ? 'teacher' : 'student';
  const nickname = user ? (user.nickname || user.displayName || '알 수 없음') : 
                   (studentSession ? studentSession.teacherNickname : '알 수 없음');
  const studentName = studentSession ? studentSession.studentName : '';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 px-4 py-2 rounded-full transition duration-300"
      >
        <FaUser className="text-gray-600" />
        <span className="text-gray-800 font-medium">{displayName}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          {user && (
            <button
              onClick={() => {
                onEditProfile();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              내 정보 수정
            </button>
          )}
          {studentSession && (
            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
              {studentSession.studentName} 학생
            </div>
          )}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      )}
      {showLogoutModal && (
        <LoginSuccessModal 
          onClose={() => setShowLogoutModal(false)}
          userType={userType}
          nickname={nickname}
          studentName={studentName}
        />
      )}
    </div>
  );
};

export default UserMenu;
