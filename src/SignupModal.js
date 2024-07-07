import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, setDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

function SignupModal({ onClose, onLoginClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [nickname, setNickname] = useState('');
  const [classCode, setClassCode] = useState('');
  const [deploymentCode, setDeploymentCode] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);

  useEffect(() => {
    setDeploymentCode(`${nickname}-${classCode}`);
  }, [nickname, classCode]);

  const checkEmailExists = async (email) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const checkNicknameExists = async (nickname) => {
    const q = query(collection(db, "users"), where("nickname", "==", nickname));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleEmailCheck = async () => {
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setError("이미 가입된 이메일입니다.");
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
    if (!nickname) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (nickname.includes(' ')) {
      setError("닉네임에 공백을 사용할 수 없습니다.");
      return;
    }
    setIsLoading(true);
    try {
      const exists = await checkNicknameExists(nickname);
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
    setClassCode(value);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isEmailChecked) {
      setError("이메일 중복 확인을 해주세요.");
      return;
    }
    if (!isNicknameChecked) {
      setError("닉네임 중복 확인을 해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (classCode.length !== 4) {
      setError("학급 코드는 4자리여야 합니다.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update displayName
      await updateProfile(user, { displayName: nickname });

      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: email,
        openaiKey: openaiKey,
        nickname: nickname,
        classCode: classCode,
        deploymentCode: deploymentCode
      });

      alert("회원가입이 완료되었습니다. 첫 페이지로 이동합니다.");
      onClose();
    } catch (error) {
      console.error("Signup error:", error);
      setError(`회원가입에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
            <div className="border-gray-500 mt-1 flex rounded-md shadow-sm">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setIsEmailChecked(false); }}
                className="bg-gray-50 flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
            <div className="border-gray-500 mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value.replace(/\s/g, '')); setIsNicknameChecked(false); }}
                className="bg-gray-50 flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700">학급 코드 (4자리 숫자 또는 알파벳)</label>
            <input
              type="text"
              id="classCode"
              value={classCode}
              onChange={handleClassCodeChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              maxLength={4}
              required
            />
          </div>
          <div>
            <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700">OpenAI API 키</label>
            <input
              type="password"
              id="openaiKey"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
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
            {isLoading ? '처리 중...' : '회원가입'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          이미 계정이 있으신가요?{' '}
          <button
            onClick={onLoginClick}
            className="text-blue-500 hover:text-blue-600 focus:outline-none"
          >
            로그인
          </button>
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default SignupModal;