import React, { useState, useCallback } from 'react';
import './App.css';
import './custom.css';

const API_URL = '/.netlify/functions/evaluate-student';

const TableDisplay = ({ headers, data }) => {
  return (
    <div className="mt-4">
      {headers && headers.length > 0 && (
        <table className="border-collapse border border-gray-400">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border border-gray-400 px-2 py-1">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-gray-400 px-2 py-1">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const ProgressBar = ({ total, completed }) => {
  const percentage = (completed / total) * 100;
  return (
    <div className="w-full bg-gray-200 rounded">
      <div
        className="bg-blue-500 text-xs leading-none py-1 text-center text-white rounded"
        style={{ width: `${percentage}%` }}
      >
        {completed} / {total}
      </div>
    </div>
  );
};

function StudentEvaluation() {
  const [pdfFile, setPdfFile] = useState(null);
  const [jsonData, setJsonData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [completedStudents, setCompletedStudents] = useState(0);

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

  const handleInitialRequest = useCallback(async () => {
    if (!pdfFile) {
      setError('PDF 파일을 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('type', 'initial');

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('서버 오류가 발생했습니다.');
      }

      const data = await response.json();
      console.log('총 학생 수:', data.totalStudents);
      setTotalStudents(data.totalStudents);

    } catch (error) {
      console.error('오류:', error);
      setError('초기 요청 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [pdfFile]);

  const handleStudentRequest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ type: 'student', index: completedStudents }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('서버 오류가 발생했습니다.');
      }

      const data = await response.json();
      console.log('학생 데이터:', data);

      setJsonData((prevData) => [...prevData, data]);
      setCompletedStudents((prevCount) => prevCount + 1);

    } catch (error) {
      console.error('오류:', error);
      setError('학생 데이터 요청 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [completedStudents]);

  return (
    <div className="flex-grow py-6 flex justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-7xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white sm:rounded-3xl sm:p-20">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">학생 성적 평가 도구</h1>
            <div className="text-sm font-normal text-center mb-10 text-gray-400">PDF 기반 평가 분석</div>

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

            <button
              onClick={handleInitialRequest}
              disabled={isLoading || !pdfFile}
              className={`w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 ${(isLoading || !pdfFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '초기 요청 중...' : '총 학생 수 구하기'}
            </button>

            {totalStudents > 0 && (
              <>
                <button
                  onClick={handleStudentRequest}
                  disabled={isLoading || completedStudents >= totalStudents}
                  className={`w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 ${(isLoading || completedStudents >= totalStudents) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? '학생 데이터 요청 중...' : '다음 학생 데이터 가져오기'}
                </button>

                <ProgressBar total={totalStudents} completed={completedStudents} />
              </>
            )}

            {error && (
              <div className="mt-4 text-red-500 text-center">
                {error}
              </div>
            )}

            {jsonData.length > 0 && (
              <div className="mt-8">
                <TableDisplay 
                  headers={Object.keys(jsonData[0])} 
                  data={jsonData} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentEvaluation;
