import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const API_URL = '/.netlify/functions/analyze-image';

// 히스토리 아이템 컴포넌트
const HistoryItem = ({ item, onClick }) => (
  <button
    onClick={() => onClick(item)}
    className="bg-blue-500 text-white rounded-full px-4 py-2 m-1 hover:bg-blue-600 transition duration-300"
  >
    {new Date(item.createdAt?.toDate()).toLocaleString()}
  </button>
);

// 모달 컴포넌트
const Modal = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">분석 결과</h2>
        <p className="mb-4">{content.result}</p>
        <p className="text-sm text-gray-500 mb-4">
          생성 시간: {new Date(content.createdAt?.toDate()).toLocaleString()}
        </p>
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [history, setHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    fetchRecentAnalyses();
  }, []);

  const fetchRecentAnalyses = async () => {
    const analysesRef = collection(db, "analysisResults");
    const q = query(analysesRef, orderBy("createdAt", "desc"), limit(3));
    const querySnapshot = await getDocs(q);
    const recentAnalyses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHistory(recentAnalyses);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      alert('먼저 이미지를 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setResult('');
    setSaveStatus('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ image })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.result);
        await saveResult(data.result);
        await fetchRecentAnalyses();  // 분석 후 히스토리 업데이트
      } else {
        throw new Error(data.error || '오류가 발생했습니다');
      }
    } catch (error) {
      console.error('오류:', error);
      setResult(`오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResult = async (analysisResult) => {
    try {
      const docRef = await addDoc(collection(db, "analysisResults"), {
        imageUrl: image,
        result: analysisResult,
        createdAt: serverTimestamp()
      });
      setSaveStatus('결과가 성공적으로 저장되었습니다. ID: ' + docRef.id);
    } catch (error) {
      console.error('저장 오류:', error);
      setSaveStatus('결과 저장 중 오류가 발생했습니다.');
    }
  };

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  const openModal = (item) => {
    setModalContent(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col font-pretendard">
      {/* GNB */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
          <div className="relative flex items-center justify-between h-12">
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={toggleSideMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 transition duration-300 ease-in-out"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center sm:items-stretch">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-gray-900 font-bold text-xl">T.R.I.P.O.D.</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Menu */}
      <div className={`fixed inset-0 z-50 ${isSideMenuOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-black ${isSideMenuOpen ? 'opacity-25' : 'opacity-0 pointer-events-none'} transition-opacity duration-300 ease-in-out`}
          onClick={toggleSideMenu}
        ></div>
        
        <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-300 ease-in-out`}>
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">메뉴</h2>
            <ul>
              <li className="mb-4"><button className="text-gray-600 hover:text-gray-900 transition duration-300 ease-in-out">홈</button></li>
              <li className="mb-4"><button className="text-gray-600 hover:text-gray-900 transition duration-300 ease-in-out">소개</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">✨이미지 분석</h1>
              <div className="mb-8">
                <label className="m-auto w-[300px] flex flex-col items-center px-4 py-6 bg-gray-50 text-gray-600 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition duration-300 ease-in-out">
                  <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                  </svg>
                  <span className="mt-2 text-base leading-normal">이미지 선택</span>
                  <input type='file' className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
              </div>
              {image && (
                <div className="mt-4 mb-8">
                  <img src={image} alt="업로드된 이미지" className="max-w-full h-auto rounded-lg border border-gray-300" />
                </div>
              )}
              <div className="flex items-center justify-center">
                <button
                  onClick={analyzeImage}
                  disabled={!image || isLoading}
                  className={`px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out ${(!image || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? '분석 중...' : '이미지 분석'}
                </button>
              </div>
              {result && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-2 text-gray-800">분석 결과:</h2>
                  <p className="whitespace-break-spaces text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-300">{result}</p>
                  {saveStatus && <p className="mt-2 text-sm text-gray-600">{saveStatus}</p>}
                </div>
              )}
              
              {/* History Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">최근 분석 결과:</h3>
                <div className="flex flex-wrap flex-col">
                  {history.map((item) => (
                    <HistoryItem key={item.id} item={item} onClick={openModal} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={modalContent}
      />
    </div>
  );
}

export default App;

console.log(process.env.API_KEY);
console.log(process.env.AUTH_DOMAIN);
console.log(process.env.PROJECT_ID);
console.log(process.env.STORAGE_BUCKET);
console.log(process.env.MESSAGING_SENDER_ID);
console.log(process.env.APP_ID);