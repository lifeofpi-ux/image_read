import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import './custom.css';
import Modal from 'react-modal';
import { FaCopy, FaDownload, FaInfoCircle, FaCog } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';

const EVALUATION_CRITERIA_API_URL = '/.netlify/functions/extract-pdf-data';
const EVALUATE_STUDENT_API_URL = '/.netlify/functions/evaluate-student';

const EvaluationCriteria = ({ criteria }) => {
  if (!criteria) return null;

  return (
    <div className="w-full mt-4 p-4 bg-yellow-100 rounded-lg">
      <h2 className="text-xl font-semibold mb-2">🧿 평가 기준</h2>
      {criteria.영역.map((area, index) => (
        <div key={index} className="mb-2">
          <p className="ml-3"><strong>영역:</strong> {area}</p>
          <p className="ml-3"><strong>성취기준:</strong> {criteria.성취기준[index]}</p>
          <p className="ml-3"><strong>평가요소:</strong> {criteria.평가요소[index]}</p>
        </div>
      ))}
    </div>
  );
};

const StudentEvaluation = ({ evaluations }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('평가 결과가 클립보드에 복사되었습니다.');
    }, (err) => {
      console.error('복사 중 오류가 발생했습니다:', err);
    });
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(evaluations.map(evaluation => ({
      '번호': evaluation.학생데이터.번호,
      '이름': evaluation.학생데이터.이름,
      '평가결과': evaluation.평가결과,
      ...evaluation.학생데이터.평가점수
    })));
    XLSX.utils.book_append_sheet(wb, ws, "학생평가결과");
    XLSX.writeFile(wb, "학생평가결과.xlsx");
  };

  return (
    <div className="mt-8 rounded-lg max-w-7xl font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">학생 평가 결과</h2>
        <button onClick={downloadExcel} className="text-gray-500 hover:text-gray-700">
          <FaDownload size={15} />
        </button>
      </div>
      {evaluations.map((evaluation, index) => (
        <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              {evaluation.학생데이터.번호}번 {evaluation.학생데이터.이름}
            </span>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-3">
                {Object.entries(evaluation.학생데이터.평가점수)
                  .map(([area, score]) => `${area}(${score})`)
                  .join(' ')}
              </span>
              <button onClick={() => copyToClipboard(evaluation.평가결과)} className="text-gray-400 hover:text-gray-500">
                <FaCopy size={12} />
              </button>
            </div>
          </div>
          <p className="text-gray-700 mt-2">{evaluation.평가결과}</p>
        </div>
      ))}
    </div>
  );
};

const ProgressBar = ({ progress, total }) => (
  <div className="w-full mt-4">
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 mr-2">진행률</span>
        <span className="text-sm font-medium text-blue-500">{progress}%</span>
      </div>
      <span className="text-sm font-medium text-gray-700">{total}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3 relative">
      <div
        className="bg-green-400 h-3 rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

const ToneSelector = ({ selectedTone, onToneChange }) => (
  <div className="flex justify-center space-x-4 w-full mt-2">
    {['neisRecord', 'growthFeedback'].map((tone) => (
      <button
        key={tone}
        className={`px-2 py-2 rounded-full transition-colors duration-300 ease-in-out text-sm ${
          selectedTone === tone
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } flex items-center justify-center font-bold w-40 h-10`}
        onClick={() => onToneChange(tone)}
      >
        {selectedTone === tone && (
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {tone === 'neisRecord' ? '나이스 기록' : '피드백용'}
      </button>
    ))}
  </div>
);

const CreativitySlider = ({ creativity, onCreativityChange }) => (
  <div className="mt-4 w-full mb-4">
    <label htmlFor="creativity" className="block text-sm font-medium text-gray-700">
      창의적 표현: {creativity === 0.1 ? '낮음' : creativity === 0.5 ? '보통' : creativity === 0.9 ? '높음' : `${creativity.toFixed(2)}`}
    </label>
    <input
      type="range"
      id="creativity"
      name="creativity"
      min="0.1"
      max="0.9"
      step="0.1"
      value={creativity}
      onChange={(e) => onCreativityChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
    <div className="flex justify-between text-xs text-gray-600">
      <span>낮음</span>
      <span>보통</span>
      <span>높음</span>
    </div>
  </div>
);

const WordCountSlider = ({ wordCount, onWordCountChange }) => (
  <div className="mt-8 w-full mb-4">
    <label htmlFor="word-count" className="block text-sm font-medium text-gray-700">
      피드백 글자 수: {wordCount}
    </label>
    <input
      type="range"
      id="word-count"
      name="word-count"
      min="150"
      max="350"
      step="50"
      value={wordCount}
      onChange={(e) => onWordCountChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
    <div className="flex justify-between text-xs text-gray-600">
      <span>150</span>
      <span>250</span>
      <span>350</span>
    </div>
  </div>
);

function StudentEvaluationTool() {
  const [pdfFile, setPdfFile] = useState(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fullText, setFullText] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTone, setSelectedTone] = useState('neisRecord');
  const [stopModalIsOpen, setStopModalIsOpen] = useState(false);
  const [infoModalIsOpen, setInfoModalIsOpen] = useState(false);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [wordCount, setWordCount] = useState(250);
  const [creativity, setCreativity] = useState(0.5);
  const abortControllerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [studentSession, setStudentSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentModel, setCurrentModel] = useState('GPT-4.1-mini');
  const [hasPersonalKey, setHasPersonalKey] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsTeacher(userData.role === 'teacher');
          
          // 개인 키 보유 여부 확인 및 모델 설정
          const hasKey = !!(userData.openaiKey && userData.openaiKey.trim());
          setHasPersonalKey(hasKey);
          setCurrentModel(hasKey ? 'GPT-4.1' : 'GPT-4.1-mini');
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsTeacher(false);
        setHasPersonalKey(false);
        setCurrentModel('GPT-4.1-mini');
        
        // 학생 세션 확인
        const sessionData = Cookies.get('studentSession');
        if (sessionData) {
          const parsedSessionData = JSON.parse(sessionData);
          setStudentSession(parsedSessionData);
          setIsAuthenticated(true);
          
          // 학생 세션의 경우 교사의 키 정보 확인 필요
          if (parsedSessionData.teacherId) {
            try {
              const teacherDoc = await getDoc(doc(db, 'users', parsedSessionData.teacherId));
              if (teacherDoc.exists()) {
                const teacherData = teacherDoc.data();
                const hasTeacherKey = !!(teacherData.openaiKey && teacherData.openaiKey.trim());
                setHasPersonalKey(hasTeacherKey);
                setCurrentModel(hasTeacherKey ? 'GPT-4.1' : 'GPT-4.1-mini');
              }
            } catch (error) {
              console.error('교사 정보 확인 중 오류:', error);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setError('PDF 파일만 업로드 가능합니다.');
      setPdfFile(null);
    }
  }, []);

  const handlePdfParsing = useCallback(async () => {
    if (!pdfFile) {
      setError('PDF 파일을 업로드해주세요.');
      return;
    }

    if (!user && !studentSession) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStudentEvaluations([]);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      if (user) {
        formData.append('userId', user.uid);
        if (isTeacher) {
          formData.append('teacherId', user.uid);
        }
      } else if (studentSession) {
        formData.append('userId', studentSession.studentId);
        formData.append('teacherId', studentSession.teacherId);
      }

      const response = await fetch(EVALUATION_CRITERIA_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`서버 오류: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      setEvaluationCriteria({ 영역: data.영역, 성취기준: data.성취기준, 평가요소: data.평가요소 });
      setTotalStudents(data.총학생수);
      setFullText(data.fullText);
      setModalIsOpen(true);
    } catch (error) {
      setError('PDF 처리 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [pdfFile, user, isTeacher, studentSession]);

  const evaluateAllStudents = useCallback(async () => {
    if (!evaluationCriteria || totalStudents === 0) {
      setError('평가 기준과 학생 수를 먼저 추출해주세요.');
      return;
    }
  
    if (!isAuthenticated) {
      setError('로그인이 필요합니다.');
      return;
    }
  
    setIsEvaluating(true);
    setIsLoading(true);
    setError(null);
    setStudentEvaluations([]);
    setProgress(0);
  
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
  
    try {
      for (let i = 1; i <= totalStudents; i++) {
        const requestData = {
          evaluationCriteria, 
          studentIndex: i,
          fullText,
          tone: selectedTone,
          wordCount,
          creativity,
          userId: user?.uid,
          teacherId: isTeacher ? user?.uid : null
        };
  
        const response = await fetch(EVALUATE_STUDENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          signal,
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`서버 오류: ${errorData.error || response.statusText}`);
        }
  
        const data = await response.json();
        setStudentEvaluations(prev => [...prev, data]);
        setProgress(Math.round((i / totalStudents) * 100));
  
        if (signal.aborted) {
          throw new Error('평가가 중지되었습니다.');
        }
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message === '평가가 중지되었습니다.') {
        setError('평가가 중지되었습니다.');
      } else {
        setError(`학생 평가 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      setIsEvaluating(false);
      setIsLoading(false);
    }
  }, [evaluationCriteria, totalStudents, fullText, selectedTone, isAuthenticated, wordCount, creativity, user, isTeacher]);
  
  const stopEvaluation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsEvaluating(false);
    setIsLoading(false);
    setStopModalIsOpen(true);
  };

  const customModalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '30px 40px',
      border: 'none',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '90%',
      width: '380px',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: '3',
    },
  };

  return (
    <div className="flex-grow py-6 flex justify-center sm:py-12">
      <div className="relative py-3">
        <div className="relative px-4 py-10 bg-white w-[700px] rounded-lg">
          <div className="w-full">
            <div className="flex items-center justify-center mb-2">
              <h1 className="text-2xl font-semibold text-center text-gray-800">학생 성적 평가 도구</h1>
              <button 
                onClick={() => setInfoModalIsOpen(true)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <FaInfoCircle size={20} />
              </button>
            </div>
            <div className="text-sm font-normal text-center mb-2 text-gray-400">PDF 기반 성적 분석</div>
            <div className="text-sm font-normal text-center mb-10 text-gray-400">
              현재 사용 모델: {currentModel} {hasPersonalKey ? '(개인 키)' : '(기본 키)'}
            </div>

            {isAuthenticated ? (
              <>
                <div className="mb-8">
                  <label className="m-auto w-[300px] flex flex-col items-center px-4 py-6 bg-gray-50 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition duration-300 ease-in-out border-2 border-dashed border-[#d1d1d1]">
                    <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04-.74-.12-1.1zM11 11h3l-4 4h3v3h2v-3z" />
                    </svg>
                    <span className="mt-2 text-base leading-normal">PDF 파일 선택</span>
                    <input type='file' className="hidden" onChange={handleFileChange} accept=".pdf" />
                  </label>
                  {pdfFile && <p className="mt-2 text-center text-sm text-gray-600">{pdfFile.name}</p>}
                </div>

                <div className="flex justify-center items-center space-x-4 mb-8">
                  <button
                    onClick={() => setSettingsModalIsOpen(true)}
                    className="px-4 py-2 rounded-full transition-colors duration-300 ease-in-out bg-gray-200 text-gray-700 hover:bg-gray-300 w-40 h-10 flex items-center font-bold justify-center"
                  >
                    <FaCog className="mr-2" />
                    평가 설정
                  </button>
                  <button
                    onClick={handlePdfParsing}
                    disabled={isLoading || !pdfFile}
                    className={`px-4 py-2 rounded-full transition-colors duration-300 ease-in-out ${
                      isLoading || !pdfFile
                        ? 'bg-gray-300 text-gray-500 font-bold cursor-not-allowed'
                        : 'bg-blue-500 text-white font-bold hover:bg-blue-600'
                    } w-40 h-10 flex items-center font-bold justify-center`}
                  >
                    {isLoading ? '분석 중...' : '평가하기'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-red-500">로그인이 필요합니다.</p>
                {/* 로그인 버튼 또는 로그인 페이지로의 링크를 여기에 추가 */}
              </div>
            )}

            {error && (
              <div className="mt-4 text-sm text-red-400 text-center font-bold">
                {error}
              </div>
            )}

            {evaluationCriteria && <EvaluationCriteria criteria={evaluationCriteria} />}
            {isEvaluating && (
              <div className="mt-8 rounded-lg relative">
                <ProgressBar progress={progress} total={`${studentEvaluations.length}/${totalStudents}`} />
              </div>
            )}

            {studentEvaluations.length > 0 && <StudentEvaluation evaluations={studentEvaluations} />}

            <Modal
              isOpen={modalIsOpen}
              onRequestClose={() => setModalIsOpen(false)}
              style={customModalStyles}
              contentLabel="학생 평가 확인"
              ariaHideApp={false}
            >
              <div className="flex flex-col items-center font-sans">
                <h2 className="text-xl font-bold mt-4 mb-6 text-center">✨ 피드백을 진행하시겠습니까?</h2>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setModalIsOpen(false)}
                    className="px-4 py-2 font-semibold bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-300 w-24 mb-4"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      setModalIsOpen(false);
                      evaluateAllStudents();
                    }}
                    className="px-4 py-2 font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 w-24 mb-4"
                  >
                    확인
                  </button>
                </div>
              </div>
            </Modal>

            {isEvaluating && (
              <button
                onClick={stopEvaluation}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300 mt-4"
              >
                <div className="flex justify-center items-center space-x-2">
                  <span>평가 중지</span>
                  <div className="spinner"></div>
                </div>
              </button>
            )}

            <Modal
              isOpen={stopModalIsOpen}
              onRequestClose={() => setStopModalIsOpen(false)}
              style={customModalStyles}
              contentLabel="평가 중지 알림"
              ariaHideApp={false}
            >
              <div className="flex flex-col items-center font-sans">
                <h2 className="text-xl font-bold mt-4 mb-6 text-center">평가가 중지되었습니다.</h2>
                <button
                  onClick={() => setStopModalIsOpen(false)}
                  className="px-4 py-2 font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 w-24 mb-4"
                >
                  확인
                </button>
              </div>
            </Modal>

            <Modal
              isOpen={infoModalIsOpen}
              onRequestClose={() => setInfoModalIsOpen(false)}
              style={customModalStyles}
              contentLabel="NEIS 성적 데이터 출력 방법"
              ariaHideApp={false}
            >
              <div className="flex flex-col items-center font-sans">
                <h2 className="text-xl font-bold mt-4 mb-6 text-center">🍀NEIS 성적 데이터 출력 방법</h2>
                <ol className="list-inside text-left ">
                  <li className="mb-2 text-sm font-light">I. NEIS 학급담임-성적조회-교과별성적조회 탭</li>
                  <li className="mb-2 text-sm font-light">II. 옵션 중 한페이지로 출력 체크(중요) 후 조회 버튼</li>
                  <li className="mb-2 text-sm font-light">III. 뷰어 왼쪽 저장 아이콘 클릭 및 PDF 선택 후 저장</li>
                  <li className="mb-2 text-sm font-light">IV. 뷰어 왼쪽 저장 아이콘 클릭 및 PDF 선택 후 저장</li>
                </ol>
                <h2 className="text-xl font-bold mt-4 mb-6 text-center">🔥전학생 존재시 필수 처리 사항</h2>
                <ol className="list-inside text-left ">
                  <li className="mb-2 text-sm font-light">I. NEIS 학급담임-성적조회-교과별성적조회 탭</li>
                  <li className="mb-2 text-sm font-light">II. 옵션 중 한페이지로 출력 체크(중요) 후 조회 버튼</li>
                  <li className="mb-2 text-sm font-light">III. 뷰어에서 한글 파일 선택 후 저장</li>
                  <li className="mb-2 text-sm font-light">IV. 한글 문서에서 전학생 번호에 해당하는 셀 모두 추가</li>
                  <li className="mb-2 text-sm font-light">V. "전학생"이라고 입력 및 가상 성적 입력 후 PDF 저장</li>
                  </ol>
                <button
                  onClick={() => setInfoModalIsOpen(false)}
                  className="px-4 py-2 font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 w-24 mt-6"
                >
                  확인
                </button>
              </div>
            </Modal>

            <Modal
              isOpen={settingsModalIsOpen}
              onRequestClose={() => setSettingsModalIsOpen(false)}
              style={customModalStyles}
              contentLabel="평가 프롬프트 설정"
              ariaHideApp={false}
            >
              <div className="flex flex-col items-center font-sans w-full">
                <h2 className="text-xl font-bold mt-2 text-center mb-8" >✨ 평가 프롬프트 설정 </h2>
                <ToneSelector selectedTone={selectedTone} onToneChange={setSelectedTone} />
                <WordCountSlider wordCount={wordCount} onWordCountChange={setWordCount} />
                <CreativitySlider creativity={creativity} onCreativityChange={setCreativity} />
                <button
                  onClick={() => setSettingsModalIsOpen(false)}
                  className="px-4 py-2 font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 w-24 mt-6 w-full "
                >
                  확인
                </button>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentEvaluationTool;