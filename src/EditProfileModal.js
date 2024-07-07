import React, { useState, useEffect, useCallback } from 'react';
import { updateProfile, deleteUser } from 'firebase/auth';
import { updateDoc, doc, collection, query, where, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

function EditProfileModal({ user, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    classCode: '',
    openaiKey: '',
    deploymentCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEmailChecked, setIsEmailChecked] = useState(true);
  const [isNicknameChecked, setIsNicknameChecked] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData({
              email: user.email || '',
              nickname: userData.nickname || '',
              classCode: userData.classCode || '',
              openaiKey: userData.openaiKey || '',
              deploymentCode: userData.deploymentCode || '',
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("사용자 데이터를 불러오는 중 오류가 발생했습니다.");
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      deploymentCode: `${prev.nickname}-${prev.classCode}`
    }));
  }, [formData.nickname, formData.classCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') setIsEmailChecked(false);
    if (name === 'nickname') setIsNicknameChecked(false);
  };

  const checkEmailExists = useCallback(async (email) => {
    if (!user || email === user.email) return false;
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }, [user]);

  const checkNicknameExists = useCallback(async (nickname) => {
    if (!user || nickname === user.nickname) return false;
    const q = query(collection(db, "users"), where("nickname", "==", nickname));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }, [user]);

  const handleEmailCheck = async () => {
    if (!formData.email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      const exists = await checkEmailExists(formData.email);
      if (exists) {
        setError("이미 사용 중인 이메일입니다.");
        setIsEmailChecked(false);
      } else {
        setError(null);
        setIsEmailChecked(true);
        alert("사용 가능한 이메일입니다.");
      }
    } catch (error) {
      console.error("Email check error:", error);
      setError("이메일 확인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNicknameCheck = async () => {
    if (!formData.nickname) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (formData.nickname.includes(' ')) {
      setError("닉네임에 공백을 사용할 수 없습니다.");
      return;
    }
    setIsLoading(true);
    try {
      const exists = await checkNicknameExists(formData.nickname);
      if (exists) {
        setError("이미 사용 중인 닉네임입니다.");
        setIsNicknameChecked(false);
      } else {
        setError(null);
        setIsNicknameChecked(true);
        alert("사용 가능한 닉네임입니다.");
      }
    } catch (error) {
      console.error("Nickname check error:", error);
      setError("닉네임 확인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, classCode: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!isEmailChecked) {
      setError("이메일 중복 확인을 해주세요.");
      return;
    }
    if (!isNicknameChecked) {
      setError("닉네임 중복 확인을 해주세요.");
      return;
    }
    if (formData.classCode.length !== 4) {
      setError("학급 코드는 4자리여야 합니다.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Update displayName in Firebase Auth
      await updateProfile(auth.currentUser, { displayName: formData.nickname });

      // Update user data in Firestore
      await updateDoc(doc(db, "users", user.uid), formData);

      const updatedUser = { ...user, ...formData };
      onUpdate(updatedUser);
      onClose();
    } catch (error) {
      console.error("Profile update error:", error);
      setError("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm("정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      setIsLoading(true);
      setError(null);
      try {
        // Delete user data from Firestore
        await deleteDoc(doc(db, "users", user.uid));
        
        // Delete user from Firebase Auth
        await deleteUser(auth.currentUser);
        
        onDelete();
        onClose();
      } catch (error) {
        console.error("Account deletion error:", error);
        setError("회원 탈퇴 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6 text-center">프로필 수정</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={handleEmailCheck}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm"
                disabled={isLoading}
              >
                중복 확인
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">닉네임</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={handleNicknameCheck}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm"
                disabled={isLoading}
              >
                중복 확인
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700">학급 코드 (4자리 숫자 또는 알파벳)</label>
            <input
              type="text"
              id="classCode"
              name="classCode"
              value={formData.classCode}
              onChange={handleClassCodeChange}
              className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              maxLength={4}
              required
            />
          </div>
          <div>
            <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700">OpenAI API 키</label>
            <input
              type="password"
              id="openaiKey"
              name="openaiKey"
              value={formData.openaiKey}
              onChange={handleInputChange}
              className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
        <button
          onClick={handleDeleteAccount}
          className="text-left mt-4 w-full text-sm text-red-500 hover:text-red-700 focus:outline-none"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}

export default EditProfileModal;