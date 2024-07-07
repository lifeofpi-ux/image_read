import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import Cookies from 'js-cookie';

function SLoginModal({ onClose, onLoginSuccess }) {
  const [teacherNickname, setTeacherNickname] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("로그인 시도:", teacherNickname, classCode);

      // 교사의 닉네임과 학급 코드로 사용자를 찾습니다.
      const q = query(
        collection(db, "users"),
        where("nickname", "==", teacherNickname),
        where("classCode", "==", classCode)
      );
      const querySnapshot = await getDocs(q);

      console.log("쿼리 결과:", querySnapshot.size);

      if (querySnapshot.empty) {
        throw new Error("선생님 닉네임 또는 학급 코드가 일치하지 않습니다.");
      }

      const teacherDoc = querySnapshot.docs[0];
      const teacherData = teacherDoc.data();

      console.log("선생님 데이터:", teacherData);

      // 필요한 데이터가 모두 있는지 확인
      if (!teacherData.nickname || !teacherData.classCode) {
        throw new Error("선생님 정보가 불완전합니다. 관리자에게 문의해주세요.");
      }

      // 쿠키에 학생 세션 정보를 저장합니다.
      Cookies.set('studentSession', JSON.stringify({
        teacherId: teacherDoc.id,
        teacherNickname: teacherData.nickname,
        classCode: teacherData.classCode
      }), { expires: 1 }); // 1일 후 만료

      console.log("로그인 성공");
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(teacherData);
      } else {
        console.warn("onLoginSuccess is not a function. Login successful, but callback not executed.");
      }
      onClose();
    } catch (error) {
      console.error("Login error:", error);
      setError(`로그인에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    setClassCode(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">학생 로그인</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="teacherNickname" className="block text-sm font-medium text-gray-700">선생님 닉네임</label>
            <input
              type="text"
              id="teacherNickname"
              value={teacherNickname}
              onChange={(e) => setTeacherNickname(e.target.value)}
              className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700">학급 코드</label>
            <input
              type="text"
              id="classCode"
              value={classCode}
              onChange={handleClassCodeChange}
              className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              maxLength={4}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
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

export default SLoginModal;