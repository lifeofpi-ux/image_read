import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './App.css';
import './custom.css';

const API_URL = '/api/analyze-image';

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

const PromptButton = ({ prompt, onClick }) => {
  if (!prompt) return null;

  return (
    <button
      onClick={() => onClick(prompt)}
      className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg px-6 py-3 hover:from-blue-500 hover:to-indigo-600 transition duration-300 text-left overflow-hidden text-ellipsis whitespace-nowrap w-full shadow-md"
    >
      {prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}
    </button>
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
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 "
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
        position: 'fixed', 
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

function ImageAnalysis() {
  const [image, setImage] = useState(null);
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
  const [recentPrompts, setRecentPrompts] = useState([]);
  const cropperRef = useRef(null);
  const [rubrics, setRubrics] = useState([]);
  const [currentRubric, setCurrentRubric] = useState(null);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(true);

  const fetchRubrics = useCallback(async () => {
    const rubricsRef = collection(db, "iRubric");
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
    fetchRecentPrompts();
    fetchRubrics();
  }, [fetchRubrics]);

  const fetchRecentAnalyses = async () => {
    const analysesRef = collection(db, "analysisResults");
    const q = query(analysesRef, orderBy("createdAt", "desc"), limit(3));
    const querySnapshot = await getDocs(q);
    const recentAnalyses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAnalysisHistory(recentAnalyses);
  };

  const fetchRecentPrompts = async () => {
    try {
      const promptsRef = collection(db, "analysisResults");
      const q = query(promptsRef, orderBy("createdAt", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      const prompts = querySnapshot.docs.map(doc => doc.data().prompt).filter(Boolean);
      setRecentPrompts([...new Set(prompts)]);
    } catch (error) {
      console.error("최근 프롬프트를 가져오는 중 오류 발생:", error);
      setRecentPrompts([]);
    }
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
    if (!cropperRef.current) {
      alert('먼저 이미지를 업로드하고 영역을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setResult('');
    setTokensUsed(0);
    setSaveStatus('');

    const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas();
    const croppedImage = croppedCanvas.toDataURL('image/png');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: croppedImage, prompt })
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
      await fetchRecentPrompts();
    } catch (error) {
      console.error('오류:', error);
      setResult(`오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResult = async (analysisResult, userPrompt) => {
    try {
      await addDoc(collection(db, "analysisResults"), {
        result: analysisResult,
        prompt: userPrompt,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("결과 저장 중 오류 발생:", error);
    }
  };

  const handleZoom = (zoomIn) => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      if (zoomIn) {
        cropper.zoom(0.1);
      } else {
        cropper.zoom(-0.1);
      }
    }
  };

  const handleSaveRubric = async (newRubric) => {
    try {
      const docRef = await addDoc(collection(db, "iRubric"), {
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
      const rubricRef = doc(db, "iRubric", updatedRubric.id);
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
        await deleteDoc(doc(db, "iRubric", rubricId));
        console.log("Rubric deleted with ID: ", rubricId);
        setIsRubricModalOpen(false);
        fetchRubrics();
      } catch (error) {
        console.error("Error deleting rubric: ", error);
        alert('루브릭 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditRubric = (rubric) => {
    setSelectedRubric(rubric);
    setIsRubricModalOpen(true);
  };

  const handleApplyRubric = (rubric) => {
    setCurrentRubric(rubric);
    setIsRubricModalOpen(false);
    
    // 루브릭 내용을 프롬프트에 적용
    const rubricPrompt = `평가 주제: ${rubric.summary}
성취기준: ${rubric.acnum}
평가 프롬프트: ${rubric.rubric}
평가 기준:
- 우수: ${rubric.high}
- 보통: ${rubric.mid}
- 노력요함: ${rubric.low}

위의 루브릭을 바탕으로 다음 이미지를 분석해주세요:`;

    setPrompt(rubricPrompt);
  };

  return (
    <div className="flex-grow py-6 flex justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-7xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white sm:rounded-3xl sm:p-20">
          <div className="max-w-6xl mx-auto">
            <div className="w-[760px] px-4">
              <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">✨ 이미지 산출물 기반 평가 분석 도구</h1>
              <div className="text-sm font-normal text-center mb-10 text-gray-400">ChatGPT-4 Omni</div>
              <div className="mb-8">
                <label className="m-auto w-[300px] flex flex-col items-center px-4 py-6 bg-gray-50 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition duration-300 ease-in-out border-2 border-dashed border-[#d1d1d1]">
                  <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                  </svg>
                  <span className="mt-2 text-base leading-normal">이미지 선택</span>
                  <input type='file' className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
              </div>
              {image && (
                <div className="m-auto mt-4 mb-8 relative">
                  <Cropper
                    src={image}
                    style={{ height: 400, width: "100%" }}
                    initialAspectRatio={0}
                    aspectRatio={0}
                    guides={true}
                    scalable={true}
                    zoomable={true}
                    ref={cropperRef}
                  />
                 
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    
                    <button
                      onClick={() => handleZoom(true)}
                      className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleZoom(false)}
                      className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <div className="mb-8 relative">
                <label className="block text-gray-700 text-base font-bold mb-2" htmlFor="prompt">
                  👉 사용자 프롬프트
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    rows="4"
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
                    placeholder="이미지에 대해 알고 싶은 내용을 입력하세요."
                  ></textarea>
              
                  {/* <button
                    onClick={saveCustomPrompt}
                    disabled={!prompt}
                    className={`absolute left-3 bottom-4 w-8 h-8 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out ${
                      !prompt ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </button>
                   */}

                  <button
                    onClick={analyzeImage}
                    disabled={!prompt || isLoading}
                    className={`absolute right-3 bottom-4 w-8 h-8 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out ${
                      (!prompt || isLoading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
              {result && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-2 text-gray-800">📝 분석 결과 </h2>
                  <p className="whitespace-break-spaces text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-300">{result}</p>
                  <p className="text-sm text-gray-600 mt-2">🎫 사용된 토큰량: {tokensUsed}</p>
                  {saveStatus && <p className="mt-2 text-sm text-gray-600">{saveStatus}</p>}
                </div>
              )}

              <div className="w-full flex mt-8">
                {/* 최근 프롬프트 (왼쪽) */}
                <div className="w-1/2 pr-4">
                  <h3 className="text-base font-semibold mb-4">📑 최근 프롬프트</h3>
                  <div className="flex flex-col space-y-3">
                    {recentPrompts.slice(0, 2).map((recentPrompt, index) => (
                      <PromptButton key={index} prompt={recentPrompt} onClick={setPrompt} />
                    ))}
                  </div>
                </div>

                {/* 최근 분석 결과 (오른쪽) */}
                <div className="w-1/2 pl-4">
                  <h3 className="text-base font-semibold mb-4">📰 최근 분석 결과</h3>
                  <div className="flex flex-col space-y-3">
                    {analysisHistory.slice(0, 2).map((item) => (
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
        <div className="p-6 h-full overflow-y-auto relative">
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

      {/* Right side tab toggle button */}
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
    </div>
  );
}

export default ImageAnalysis;
