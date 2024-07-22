import React, { useState, useCallback, useRef } from 'react';
import './App.css';
import './custom.css';
import Modal from 'react-modal';
import { FaCopy, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const EVALUATION_CRITERIA_API_URL = '/.netlify/functions/extract-pdf-data';
const EVALUATE_STUDENT_API_URL = '/.netlify/functions/evaluate-student';

const EvaluationCriteria = ({ criteria }) => {
  if (!criteria) return null;

  return (
    <div className="w-full mt-4 p-4 bg-yellow-100 rounded-lg">
      <h2 className="text-xl font-semibold mb-2">평가 기준</h2>
      {criteria.영역.map((area, index) => (
        <div key={index} className="mb-2">
          <p><strong>영역:</strong> {area}</p>
          <p><strong>성취기준:</strong> {criteria.성취기준[index]}</p>
          <p><strong>평가요소:</strong> {criteria.평가요소[index]}</p>
        </div>
      ))}
    </div>
  );
};

const TotalStudents = ({ total }) => (
  <div className="mt-4 p-4 bg-blue-100 rounded-lg">
    <h2 className="text-xl font-semibold mb-2">총 학생 수</h2>
    <p>{total || '데이터 없음'}</p>
  </div>
);

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
      '평가결과': evaluation.평가결과
    })));
    XLSX.utils.book_append_sheet(wb, ws, "학생평가결과");
    XLSX.writeFile(wb, "학생평가결과.xlsx");
  };

  return (
    <div className="mt-4 p-4 bg-green-100 rounded-lg max-w-7xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">학생 평가 결과</h2>
        <button onClick={downloadExcel} className="text-blue-500 hover:text-blue-700">
          <FaDownload size={20} />
        </button>
      </div>
      {evaluations.map((evaluation, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{evaluation.학생데이터.번호}번 {evaluation.학생데이터.이름}</span>
            <button onClick={() => copyToClipboard(evaluation.평가결과)} className="text-gray-500 hover:text-gray-700">
              <FaCopy size={16} />
            </button>
          </div>
          <p className="text-gray-700">{evaluation.평가결과}</p>
        </div>
      ))}
    </div>
  );
};

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-blue-600 h-2.5 rounded-full"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const ToneSelector = ({ selectedTone, onToneChange }) => (
  <div className="flex justify-center space-x-4">
    {['niceRecord', 'growthFeedback'].map((tone) => (
      <button
        key={tone}
        className={`px-4 py-2 rounded-full transition-colors duration-300 ease-in-out ${
          selectedTone === tone
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } flex items-center justify-center w-40 h-10`}
        onClick={() => onToneChange(tone)}
      >
        {tone === 'niceRecord' ? '나이스 기록용' : '성장 피드백용'}
        {selectedTone === tone && (
          <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    ))}
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
  const [selectedTone, setSelectedTone] = useState('niceRecord');
  const abortControllerRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      console.log('파일 선택됨:', file);
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

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const response = await fetch(EVALUATION_CRITERIA_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`서버 오류: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Extracted PDF Data:', data.fullText);
      setEvaluationCriteria({ 영역: data.영역, 성취기준: data.성취기준, 평가요소: data.평가요소 });
      setTotalStudents(data.총학생수);
      setFullText(data.fullText);
      setModalIsOpen(true);
    } catch (error) {
      console.error('Error details:', error);
      setError('PDF 처리 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [pdfFile]);

  const evaluateAllStudents = useCallback(async () => {
    if (!evaluationCriteria || totalStudents === 0) {
      setError('평가 기준과 학생 수를 먼저 추출해주세요.');
      return;
    }

    setIsEvaluating(true);
    setIsLoading(true);
    setError(null);
    setStudentEvaluations([]);

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      for (let i = 1; i <= totalStudents; i++) {
        const response = await fetch(EVALUATE_STUDENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            evaluationCriteria, 
            studentIndex: i,
            fullText,
            tone: selectedTone
          }),
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
          throw new Error('평가가 취소되었습니다.');
        }
      }
    } catch (error) {
      console.error('Error evaluating student:', error);
      if (error.name === 'AbortError' || error.message === '평가가 취소되었습니다.') {
        setError('평가가 취소되었습니다.');
      } else {
        setError(`학생 평가 중 오류가 발생했습니다: ${error.message}`);
      }
      setIsEvaluating(false);
      setIsLoading(false);
      return;
    }

    setIsEvaluating(false);
    setIsLoading(false);
  }, [evaluationCriteria, totalStudents, fullText, selectedTone]);

  const stopEvaluation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsEvaluating(false);
    setIsLoading(false);
  };

  const customModalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '0',
      border: 'none',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '90%',
      width: '400px',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
  };

  return (
    <div className="flex-grow py-6 flex justify-center sm:py-12">
      <div className="relative py-3">
        <div className="relative px-4 py-10 bg-white w-[700px] rounded-lg">
          <div className="w-full">
            <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">학생 성적 평가 도구</h1>
            <div className="text-sm font-normal text-center mb-10 text-gray-400">PDF 기반 성적 분석</div>

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
              <ToneSelector selectedTone={selectedTone} onToneChange={setSelectedTone} />
              <button
                onClick={handlePdfParsing}
                disabled={isLoading || !pdfFile}
                className={`px-4 py-2 rounded-full transition-colors duration-300 ease-in-out ${
                  isLoading || !pdfFile
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } w-40 h-10 flex items-center justify-center`}
              >
                {isLoading ? '처리 중...' : '평가하기'}
              </button>
            </div>

            {error && (
              <div className="mt-4 font-medium text-red-400 text-center">
                {error}
              </div>
            )}

            {evaluationCriteria && <EvaluationCriteria criteria={evaluationCriteria} />}
            {totalStudents > 0 && <TotalStudents total={totalStudents} />}
            {isEvaluating && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">평가 진행 상황</h3>
                <ProgressBar progress={progress} />
                <p className="mt-2 text-center">{progress}% 완료</p>
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
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">학생 평가를 진행하시겠습니까?</h2>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setModalIsOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-300"
          >
            아니오
          </button>
          <button
            onClick={() => {
              setModalIsOpen(false);
              evaluateAllStudents();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
          >
            예
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
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        </div>
      </button>
    )}
    </div>
    </div>
    </div>
    </div>
    );
    }

export default StudentEvaluationTool;