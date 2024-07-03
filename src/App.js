import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ImageAnalysis from './ImageAnalysis';
import RubricReportAI from './RubricReportAI'; 

function App() {
  const [isLeftSideTabOpen, setIsLeftSideTabOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const HomePage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-1 text-gray-800">T.R.I.P.O.D.</h1>
      <h1 className="text-sm font-bold mb-10 text-gray-400">수업, 평가, 교육 그리고 사람들</h1>
      <div className="space-y-5">
        <Link 
          to="/rubric-report" 
          className="block px-11 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition duration-300 text-center text-lg font-semibold"
        >
          📝 루브릭 레포트 AI
        </Link>
        <Link 
          to="/image-analysis" 
          className="block px-11 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition duration-300 text-center text-lg font-semibold"
        >
          🏠 이미지 평가 AI
        </Link>
      </div>

      <div className="absolute bottom-5 text-center text-sm text-gray-400 w-full">
        <div className="flex justify-center items-center space-x-6">
          <a 
            href="https://slashpage.com/tripod/about" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition duration-300 text-bold"
          >
            2024. T.R.I.P.O.D. 수업 혁신 연구회
          </a>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hover:text-gray-400 transition duration-300"
          >
            만든 사람
          </button>
        </div>
      </div>
    </div>
  );

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setIsModalOpen(false)}>
      <div className="bg-white p-6 rounded-lg shadow-xl min-w-[300px]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-8">😎 만든 사람</h2>
        <p className="mb-2 font-bold mt-2 py-1 text-center ">라이프오브파이</p>
        <p className="mb-4 text-center py-2">커피와 위스키, 무료함을 좋아합니다.</p>
        <button 
          onClick={() => setIsModalOpen(false)}
          className="mt-4 min-w-[100%] bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          닫기
        </button>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-800 flex relative font-sans">
        {/* Overlay for side tab */}
        {isLeftSideTabOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsLeftSideTabOpen(false)}
          ></div>
        )}
        
        {/* Left side tab */}
        <div 
          className={`fixed inset-y-0 left-0 w-80 transform ${isLeftSideTabOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-300 ease-in-out z-50 side-tab`}
          style={{
            background: '#f7f7f5',
            borderRight: 'solid 1px #c7c5bd',
          }}
        >
          <div className="p-6 pl-2 flex flex-col h-full"
            style={{
            zIndex:3000,
            }}>
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="text-gray-900 font-bold text-xl ml-3" onClick={() => setIsLeftSideTabOpen(false)}>T.R.I.P.O.D.</Link>
              <button onClick={() => setIsLeftSideTabOpen(false)} 
               className="text-gray-500 hover:text-gray-700"
               style={{
               zIndex:1,
               }}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="flex-grow">
             <li className="mb-1">
                <Link 
                  to="/rubric-report" 
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-200 rounded-lg transition duration-300 ease-in-out hover:shadow-lg"
                  onClick={() => setIsLeftSideTabOpen(false)}
                >
                  <span className="text-gray-600 font-semibold hover:text-gray-900 transition duration-300 ease-in-out">
                    📝 루브릭 레포트 AI
                  </span>
                  <span className="text-gray-600 font-bold hover:text-gray-900 transition duration-300 ease-in-out">+</span>
                </Link>
              </li>

              <li className="mb-1">
                <Link 
                  to="/image-analysis" 
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-200 rounded-lg transition duration-300 ease-in-out hover:shadow-lg"
                  onClick={() => setIsLeftSideTabOpen(false)}
                >
                  <span className="text-gray-600 font-semibold hover:text-gray-900 transition duration-300 ease-in-out">
                    🏠 이미지 평가 AI
                  </span>
                  <span className="text-gray-600 font-bold hover:text-gray-900 transition duration-300 ease-in-out">+</span>
                </Link>
              </li>
            </ul>
            <div className="mt-auto text-sm font-bold text-gray-400 ml-4">
              2024. T.R.I.P.O.D.
            </div>
          </div>
        </div>

        {/* Left side tab toggle button */}
        <button
          onClick={() => setIsLeftSideTabOpen(!isLeftSideTabOpen)}
          style={{
            zIndex:1,
            }}
          className="fixed left-4 top-4 z-50 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 transition duration-300 ease-in-out tab-toggle"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Main content area */}
        <div className={`flex-grow transition-margin duration-300 ease-in-out ${isLeftSideTabOpen ? 'ml-80' : 'ml-0'}`}>
          <Routes>
            <Route path="/image-analysis" element={<ImageAnalysis />} />
            <Route path="/rubric-report" element={<RubricReportAI />} />  
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>

        {isModalOpen && <Modal />}
      </div>
    </Router>
  );
}

export default App;