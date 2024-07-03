import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';
import './custom.css';

const API_URL = '/api/analyze-report';

const HistoryItem = ({ item, onClick }) => (
  <button
    onClick={() => onClick(item)}
    className="bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-lg px-6 py-3 hover:from-green-500 hover:to-teal-600 transition duration-300 text-left overflow-hidden text-ellipsis whitespace-nowrap w-full shadow-md"
  >
    {item.result.length > 50 ? item.result.substring(0, 50) + '...' : item.result}
  </button>
);

const Modal = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg max-h-800px overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">📝 분석 결과</h2>
        <p className="mb-4 font-light whitespace-break-spaces">👉 학생 산출물 {content.prompt}</p>
        <p className="mb-4 whitespace-break-spaces">{content.result}</p>
        <p className="text-sm text-gray-500 mb-4">
        ⏱️평가 시간: {new Date(content.createdAt?.toDate()).toLocaleString()}
        </p>
        <div className="w-full">
          <button
            onClick={onClose}
            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

const RubricModal = ({ isOpen, onClose, onSave, onDelete, onApply, initialRubric }) => {
  const [rubric, setRubric] = useState(initialRubric || {
    summary: '',
    acnum: '',
    rubric: '',
    high: '',
    mid: '',
    low: ''
  });

  useEffect(() => {
    if (initialRubric) {
      setRubric(initialRubric);
    }
  }, [initialRubric]);

  const handleChange = (e) => {
    setRubric({ ...rubric, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(rubric);
  };

  if (!isOpen) return null;

  const fieldOrder = ['summary', 'acnum', 'rubric', 'high', 'mid', 'low'];
  const fieldLabels = {
    summary: '🪴 평가 주제',
    acnum: '🧩 성취기준',
    rubric: '📝 평가 프롬프트',
    high: '😀 우수',
    mid: '😊 보통',
    low: '😀 노력요함'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4">📝 루브릭 내용</h2>
        <form onSubmit={handleSubmit}>
          {fieldOrder.map((key) => (
            <div key={key} className="mb-4">
              <label className="block text-gray-700 text-base font-bold mb-2" htmlFor={key}>
                {fieldLabels[key]}
              </label>
              <textarea
                id={key}
                name={key}
                value={rubric[key]}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="2"
              />
            </div>
          ))}
          <div className="flex justify-between items-center mt-6">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(rubric.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300 mr-2"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-300"
              >
                취소
              </button>
            </div>
            <div>
             <button
                type="button"
                onClick={() => onApply(rubric)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 mr-2"
              >
                프롬프트 적용
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                저장
              </button>
             
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const MiniPopup = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="absolute px-2 top-10 right-40 mt-2 mr-2 bg-black text-white text-sm rounded p-2 z-10 shadow-lg"
      style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '50px',
        animation: 'blink 2s linear infinite'
      }}
    >
      <style jsx>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      <span>❤️ 평가 프롬프트 설정</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-200 ">
        &times;
      </button>
    </div>
  );
};

const RubricDetailModal = ({ isOpen, onClose, rubric }) => {
  if (!isOpen || !rubric) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-xl w-full shadow-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">🏷️ 루브릭 상세 정보</h2>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">🪴 평가 주제</h3>
          <p className="ml-6" >{rubric.summary}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">🧩 성취기준</h3>
          <p className="ml-6">{rubric.acnum}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">📝 평가 프롬프트</h3>
          <p className="ml-6">{rubric.rubric}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">😀우수</h3>
          <p className="ml-6">{rubric.high}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">😊보통</h3>
          <p className="ml-6">{rubric.mid}</p>
        </div>
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">😀노력요함</h3>
          <p className="ml-6">{rubric.low}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

function RubricReportAI() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRightSideTabOpen, setIsRightSideTabOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [currentRubric, setCurrentRubric] = useState(null);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(true);
  const [isRubricDetailModalOpen, setIsRubricDetailModalOpen] = useState(false);

  const fetchRubrics = useCallback(async () => {
    const rubricsRef = collection(db, "Rubric");
    const q = query(rubricsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const rubricList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRubrics(rubricList);
    if (rubricList.length > 0 && !currentRubric) {
      setCurrentRubric(rubricList[0]);
    }
  }, [currentRubric]);

  useEffect(() => {
    fetchRecentAnalyses();
    fetchRubrics();
  }, [fetchRubrics]);

  const fetchRecentAnalyses = async () => {
    const analysesRef = collection(db, "RanalysisResults");
    const q = query(analysesRef, orderBy("createdAt", "desc"), limit(3));
    const querySnapshot = await getDocs(q);
    const recentAnalyses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAnalysisHistory(recentAnalyses);
  };

  const analyzeReport = async () => {
    if (!currentRubric) {
      alert('먼저 루브릭을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setResult('');
    setTokensUsed(0);
    setSaveStatus('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, rubric: currentRubric })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`서버 오류: ${errorData}`);
      }

      const data = await response.json();
      setResult(data.result);
      setTokensUsed(data.tokens);
      await saveResult(data.result, prompt);
      await fetchRecentAnalyses();
    } catch (error) {
      console.error('오류:', error);
      setResult(`오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRubric = async (newRubric) => {
    try {
      const docRef = await addDoc(collection(db, "Rubric"), {
        ...newRubric,
        createdAt: serverTimestamp()
      });
      console.log("Rubric saved with ID: ", docRef.id);
      setIsRubricModalOpen(false);
      fetchRubrics();
    } catch (error) {
      console.error("Error saving rubric: ", error);
      alert('루브릭 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateRubric = async (updatedRubric) => {
    try {
      const rubricRef = doc(db, "Rubric", updatedRubric.id);
      await updateDoc(rubricRef, {
        ...updatedRubric,
        updatedAt: serverTimestamp()
      });
      console.log("Rubric updated with ID: ", updatedRubric.id);
      setIsRubricModalOpen(false);
      fetchRubrics();
    } catch (error) {
      console.error("Error updating rubric: ", error);
      alert('루브릭 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteRubric = async (rubricId) => {
    if (window.confirm('이 루브릭을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, "Rubric", rubricId));
        console.log("Rubric deleted with ID: ", rubricId);
        setIsRubricModalOpen(false);
        fetchRubrics();
      } catch (error) {
        console.error("Error deleting rubric: ", error);
        alert('루브릭 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const saveResult = async (analysisResult, userPrompt) => {
    try {
      const docRef = await addDoc(collection(db, "RanalysisResults"), {
        result: analysisResult,
        prompt: userPrompt,
        createdAt: serverTimestamp()
      });
      console.log("Analysis result saved with ID: ", docRef.id);
    } catch (error) {
      console.error("Error saving analysis result: ", error);
      alert('분석 결과 저장 중 오류가 발생했습니다.');
    }
  };

  const handleEditRubric = (rubric) => {
    setSelectedRubric(rubric);
    setIsRubricModalOpen(true);
  };

  const handleApplyRubric = (rubric) => {
    setCurrentRubric(rubric);
    setIsRubricModalOpen(false);
  };

  const handleRubricDetailClick = () => {
    setIsRubricDetailModalOpen(true);
  };

  return (
    <div className="flex-grow py-6 flex justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-7xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white sm:rounded-3xl sm:p-20">
          <div className="max-w-6xl mx-auto">
            <div className="w-[760px] px-4">
              <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">✨ 루브릭 기반 산출물 평가 도구</h1>
              <div className="text-sm font-normal text-center mb-10 text-gray-400">ChatGPT-4 Omni</div>

              {/* 평가 루브릭 */}
              <div className="mb-8 relative">
                <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="rubric">
                  📊 평가 주제 
                </label>
                <div className="relative">
                  <textarea
                    id="rubric"
                    rows="3"
                    className="w-full text-gray-700 leading-tight bg-gray-100 p-4 rounded-lg pr-10"
                    value={currentRubric ? currentRubric.summary : ''}
                    readOnly
                    style={{
                      background: 'rgb(239 239 255)',
                      padding: '15px',
                      borderRadius: '16px',
                      resize: 'none',
                      outline: 'none'
                    }}                      
                  />
                  <button
                    onClick={handleRubricDetailClick}
                    className="absolute right-3 top-2/3 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 transition duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 사용자 프롬프트 */}
              <div className="mb-8 relative">
                <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="prompt">
                  👉 학생 산출물 
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    rows="6"
                    className="w-full text-gray-700 leading-tight"
                    style={{
                      background: 'rgb(237 237 237)',
                      padding: '15px',
                      borderRadius: '16px',
                      resize: 'none',
                      border: isFocused ? '3px solid #4A90E2' : '3px solid transparent',
                      transition: 'border-color 0.3s ease',
                      outline: 'none'
                    }}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="학생의 산출물과 추가적인 평가 지침을 입력하세요."
                  />
                  <button
                    onClick={analyzeReport}
                    disabled={!prompt || !currentRubric || isLoading}
                    className={`absolute right-3 bottom-4 w-8 h-8 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out ${
                      (!prompt || !currentRubric || isLoading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 분석 결과 */}
              {result && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-2 text-gray-800">📝 분석 결과 </h2>
                  <p className="whitespace-break-spaces text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-300">{result}</p>
                  <p className="text-sm text-gray-600 mt-2">🎫 사용된 토큰량: {tokensUsed}</p>
                  {saveStatus && <p className="mt-2 text-sm text-gray-600">{saveStatus}</p>}
                </div>
              )}

              <div className="w-full flex mt-8">
                {/* 최근 분석 결과 */}
                <div className="w-full mt-8">
                <h3 className="text-base font-semibold mb-4">📰 최근 분석 결과</h3>
                <div className="flex flex-col space-y-3">
                  {analysisHistory.slice(0, 3).map((item) => (
                    <HistoryItem 
                      key={item.id} 
                      item={item} 
                      onClick={(item) => {setModalContent(item); setIsModalOpen(true);}} 
                    />
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side tab */}
      <div 
        className={`fixed right-0 bg-white shadow-lg transform ${isRightSideTabOpen ? 'translate-x-0' : 'translate-x-full'} transition duration-300 ease-in-out z-50 side-tab`} 
        style={{
          top: '80px',
          bottom: '80px',
          background: 'rgb(247, 247, 245)',
          borderRadius: '15px',
          width: '340px',
          marginRight: '5px',
          border: '1px solid rgb(233 233 233)',
          zIndex: '10'
        }}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🛠️ 루브릭 설정</h2>
            <button
              onClick={() => {
                setSelectedRubric(null);
                setIsRubricModalOpen(true);
              }}
              className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col space-y-3">
            {rubrics.map((rubric) => (
              <button
                key={rubric.id}
                onClick={() => handleEditRubric(rubric)}
                className={`bg-gradient-to-r ${
                  currentRubric && currentRubric.id === rubric.id
                    ? 'from-green-500 to-teal-600'
                    : 'from-blue-500 to-purple-500'
                } text-white rounded-lg px-4 py-3 hover:from-blue-600 hover:to-purple-600 transition duration-300 text-left overflow-hidden shadow-md`}
              >
                <p className="text-base text-base text-white-900 truncate mb-1">{rubric.summary}</p>
                <p className="text-xs text-gray-200">{rubric.rubric}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side tab toggle button and MiniPopup */}
      <MiniPopup 
        isVisible={isPopupVisible}
        onClose={() => setIsPopupVisible(false)}
      />
      <button
        onClick={() => setIsRightSideTabOpen(!isRightSideTabOpen)}
        className="fixed right-4 top-4 z-50 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 transition duration-300 ease-in-out tab-toggle"
      >
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={modalContent}
      />

      <RubricModal
        isOpen={isRubricModalOpen}
        onClose={() => {
          setIsRubricModalOpen(false);
          setSelectedRubric(null);
        }}
        onSave={selectedRubric ? handleUpdateRubric : handleSaveRubric}
        onDelete={selectedRubric ? handleDeleteRubric : null}
        onApply={handleApplyRubric}
        initialRubric={selectedRubric}
      />

      <RubricDetailModal
        isOpen={isRubricDetailModalOpen}
        onClose={() => setIsRubricDetailModalOpen(false)}
        rubric={currentRubric}
      />
    </div>
  );
}

export default RubricReportAI;