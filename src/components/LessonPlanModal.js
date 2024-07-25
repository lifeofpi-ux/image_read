import React from 'react';
import html2pdf from 'html2pdf.js';

const LessonPlanModal = ({ isOpen, onClose, lessonPlan }) => {
  const downloadLessonPlan = () => {
    const blob = new Blob([lessonPlan], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '수업 설계.txt';
    link.click();
  };

  const generatePDF = () => {
    const element = document.getElementById('lessonPlanContent');
    html2pdf().from(element).set({
      margin: 1,
      filename: '수업 설계.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'in', format: 'letter', compressPDF: true }
    }).save();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">🍀 수업 설계 내용</h2>
        <div id="lessonPlanContent" className="bg-blue-50 p-4 rounded-md mb-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-base">{lessonPlan}</pre>
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={downloadLessonPlan} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">
            텍스트 파일로 저장
          </button>
          <button onClick={generatePDF} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            PDF 파일로 저장
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlanModal;