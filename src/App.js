import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ImageAnalysis from './ImageAnalysis';
import RubricReportAI from './RubricReportAI'; 

function App() {
  const [isLeftSideTabOpen, setIsLeftSideTabOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-800 flex relative font-sans">
        {/* Left side tab */}
        <div 
          className={`fixed inset-y-0 left-0 w-80 transform ${isLeftSideTabOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-300 ease-in-out z-50 side-tab`}
          style={{
            background: '#f7f7f5',
            borderRight: 'solid 1px #c7c5bd',
            zIndex:3000,
          }}
        >
          <div className="p-6 pl-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-900 font-bold text-xl ml-3">T.R.I.P.O.D.</span>
              <button onClick={() => setIsLeftSideTabOpen(false)} 
               style={{
                zIndex:1,
              }}
              className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul>
             <li className="mb-1">
                <Link 
                  to="/rubric-report" 
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-200 rounded-lg transition duration-300 ease-in-out hover:shadow-lg"
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
                >
                  <span className="text-gray-600 font-semibold hover:text-gray-900 transition duration-300 ease-in-out">
                    🏠 이미지 평가 AI
                  </span>
                  <span className="text-gray-600 font-bold hover:text-gray-900 transition duration-300 ease-in-out">+</span>
                  
                </Link>
              </li>
              { /*   
              <li className="mb-1">
                <Link 
                  to="/feedback-chatbot" 
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-200 rounded-lg transition duration-300 ease-in-out hover:shadow-lg"
                >
                 <span className="text-gray-600 font-semibold hover:text-gray-900 transition duration-300 ease-in-out">
                    🌍 피드백 챗봇
                  </span>
                  <span className="text-gray-600 hover:text-gray-900 transition duration-300 ease-in-out">+</span>
                </Link>
              </li>
              */}

            </ul>
          </div>
        </div>

        {/* Left side tab toggle button */}
        <button
          onClick={() => setIsLeftSideTabOpen(!isLeftSideTabOpen)}
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
            {/*  <Route path="/feedback-chatbot" element={<div>피드백 챗봇 페이지</div>} /> */}
            <Route path="/rubric-report" element={<RubricReportAI />} />  
            <Route path="/" element={<div>홈 페이지</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

