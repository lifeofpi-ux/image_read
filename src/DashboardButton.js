import React, { useEffect } from 'react';
import './DashboardButton.css';

const DashboardButton = ({ onClick, dashboardType }) => {
  // 컴포넌트 렌더링 시 디버깅 정보 출력
  useEffect(() => {
    console.log('DashboardButton rendered with type:', dashboardType);
  }, [dashboardType]);
  
  // 대시보드 타입에 따라 아이콘 변경 (텍스트는 항상 DASHBOARD로 통일)
  const getButtonText = () => {
    return 'DASHBOARD';
  };
  
  const getButtonIcon = () => {
    switch (dashboardType) {
      case 'chat':
        return '💬';
      case 'quiz':
        return '📊';
      case 'writing':
        return '📝';
      default:
        return '📋';
    }
  };
  
  const handleClick = (e) => {
    console.log('Dashboard button clicked');
    onClick(e);
  };
  
  return (
    <button 
      className="dashboard-button" 
      onClick={handleClick}
      aria-label="DASHBOARD"
    >
      <span className="dashboard-button-icon">{getButtonIcon()}</span>
      <span className="dashboard-button-text">{getButtonText()}</span>
    </button>
  );
};

export default DashboardButton; 