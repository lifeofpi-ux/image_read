import React, { useState, useEffect, useCallback } from 'react';
import { Route, Routes, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import ImageAnalysis from './ImageAnalysis';
import RubricReportAI from './RubricReportAI';
import ConvAI from './ConvAI';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import SLoginModal from './SLoginModal';
import HomePage from './HomePage';
import LoginSuccessModal from './LoginSuccessModal';
import UserMenu from './UserMenu';
import EditProfileModal from './EditProfileModal';
import StudentEvaluation from './StudentEvaluation';
import IdeaCanvasAI from './IdeaCanvasAI'; 
import TPACKLesson from './components/TPACKLesson'; 
import TeacherDashboard from './TeacherDashboard';
import Cookies from 'js-cookie';
import DashboardButton from './DashboardButton';
import DashboardPanel from './DashboardPanel';

function AppContent() {
  const [isLeftSideTabOpen, setIsLeftSideTabOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isStudentLoginModalOpen, setIsStudentLoginModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [studentSession, setStudentSession] = useState(null);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [loginSuccessInfo, setLoginSuccessInfo] = useState({ userType: '', nickname: '' });
  const [isManualLogin, setIsManualLogin] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');
  const [isLoginConfirmModalOpen, setIsLoginConfirmModalOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardType, setDashboardType] = useState('chat');

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      Cookies.remove('studentSession');
      setStudentSession(null);
      setUser(null);
      setIsEditProfileModalOpen(false);
      setShowLogoutModal(true);
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  }, []);

  const handleLoginSuccessClose = useCallback(() => {
    setShowLoginSuccess(false);
    if (redirectPath) {
      navigate(redirectPath);
      setRedirectPath('');
    }
  }, [redirectPath, navigate]);

  useEffect(() => {
    if (showLoginSuccess) {
      const timer = setTimeout(() => {
        handleLoginSuccessClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showLoginSuccess, handleLoginSuccessClose]);

  useEffect(() => {
    if (showLogoutModal) {
      const timer = setTimeout(() => {
        setShowLogoutModal(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showLogoutModal]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDocRef = doc(db, "users", authUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let nickname = authUser.displayName;
          let userIsTeacher = false;
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            nickname = userData.nickname || nickname;
            userIsTeacher = userData.role === 'teacher';
          }

          const updatedUser = {
            ...authUser,
            nickname: nickname
          };
          
          setUser(updatedUser);
          setIsTeacher(userIsTeacher);
          
          if (isManualLogin) {
            setShowLoginSuccess(true);
            setLoginSuccessInfo({ 
              userType: 'teacher', 
              nickname: nickname
            });
            setIsManualLogin(false);
          }
        } catch (error) {
          setUser({
            ...authUser,
            nickname: authUser.displayName || '선생님'
          });
          setIsTeacher(false);
        }
      } else {
        setUser(null);
        setIsTeacher(false);
        setIsEditProfileModalOpen(false);
      }
    });

    const storedStudentSession = Cookies.get('studentSession');
    if (storedStudentSession) {
      const parsedSession = JSON.parse(storedStudentSession);
      setStudentSession(parsedSession);
      if (isManualLogin) {
        setShowLoginSuccess(true);
        setLoginSuccessInfo({ 
          userType: 'student', 
          nickname: parsedSession.teacherNickname || '선생님'
        });
        setIsManualLogin(false);
      }
    }

    return () => unsubscribe();
  }, [isManualLogin]);

  const handleStudentLoginSuccess = useCallback((teacherData) => {
    const sessionData = {
      teacherId: teacherData.userId,
      teacherNickname: teacherData.nickname || '선생님',
      classCode: teacherData.classCode,
      studentName: teacherData.studentName || '학생',
      studentId: `${teacherData.userId}_${teacherData.classCode}_${(teacherData.studentName || '학생').replace(/\s+/g, '_')}`
    };
    setStudentSession(sessionData);
    Cookies.set('studentSession', JSON.stringify(sessionData), { expires: 1 });
    setIsStudentLoginModalOpen(false);
    setShowLoginSuccess(true);
    setLoginSuccessInfo({ 
      userType: 'student', 
      nickname: teacherData.nickname || '선생님',
      studentName: teacherData.studentName || '학생'
    });
  }, []);

  const handleEditProfile = useCallback(() => {
    setIsEditProfileModalOpen(true);
  }, []);

  const handleProfileUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
    setLoginSuccessInfo(prev => ({ ...prev, nickname: updatedUser.nickname }));
  }, []);

  const handleProfileDelete = useCallback(() => {
    setUser(null);
    setIsEditProfileModalOpen(false);
    Cookies.remove('studentSession');
    setStudentSession(null);
    setShowLoginSuccess(false);
  }, []);

  const handleLoginSelection = (isTeacher) => {
    setIsLoginConfirmModalOpen(false);
    if (isTeacher) {
      setIsLoginModalOpen(true);
    } else {
      setIsStudentLoginModalOpen(true);
    }
    setRedirectPath(selectedPath);
    setLoginSuccessInfo(prev => ({ ...prev, redirectPath: selectedPath }));
  };

  useEffect(() => {
    if ((user || studentSession) && selectedPath) {
      navigate(selectedPath);
      setSelectedPath('');
    }
  }, [user, studentSession, selectedPath, navigate]);

  const LoginConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-xs w-full">
        <h2 className="text-xl font-bold mb-3 text-center text-gray-800">로그인 필요</h2>
        <p className="mb-5 text-center text-sm text-gray-600">로그인 후 이용하실 수 있습니다.</p>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => handleLoginSelection(true)}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            👩🏻‍🏫 선생님 로그인
          </button>
          <button 
            onClick={() => handleLoginSelection(false)}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow-md hover:from-pink-600 hover:to-pink-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            👩🏻‍💻 학생 로그인
          </button>
        </div>
        <button 
          onClick={() => setIsLoginConfirmModalOpen(false)}
          className="mt-5 w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out"
        >
          닫기
        </button>
      </div>
    </div>
  );

  const NavigationButton = ({ to, text }) => {
    const handleClick = () => {
      if (user || studentSession) {
        navigate(to);
      } else {
        setSelectedPath(to);
        setIsLoginConfirmModalOpen(true);
      }
      setIsLeftSideTabOpen(false);
    };

    return (
      <button 
        onClick={handleClick}
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-200 rounded-lg transition duration-300 ease-in-out hover:shadow-lg w-full text-left"
      >
        <span className="text-gray-600 font-semibold hover:text-gray-900 transition duration-300 ease-in-out">
          {text}
        </span>
        <span className="text-gray-600 font-bold hover:text-gray-900 transition duration-300 ease-in-out">+</span>
      </button>
    );
  };

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

  // 현재 경로에 따라 대시보드 타입을 결정하는 함수
  const getDashboardTypeFromPath = (path) => {
    if (path.includes('/chat') || path === '/') {
      return 'chat';
    } else if (path.includes('/quiz')) {
      return 'quiz';
    } else if (path.includes('/writing')) {
      return 'writing';
    }
    return 'chat'; // 기본값
  };
  
  // 현재 라우트에 대시보드 버튼을 표시할지 결정하는 함수
  const shouldShowDashboardButton = (path) => {
    // 콘솔에 현재 사용자 상태 및 권한 로깅 (디버깅 목적)
    console.log('Debug - User state:', !!user);
    console.log('Debug - Teacher state:', isTeacher);
    console.log('Debug - Current path:', path);
    
    // 로그인 상태가 아니거나 선생님이 아니면 대시보드 버튼을 표시하지 않음
    if (!user) {
      console.log('Debug - No user logged in');
      return false;
    }

    // 학생으로 로그인한 경우 대시보드 버튼을 표시하지 않음
    if (studentSession) {
      console.log('Debug - Student session active');
      return false;
    }
    
    // 임시: 디버깅 중에는 모든 사용자에게 버튼 표시
    // 실제 배포 시 아래 주석 해제
    // if (!isTeacher) {
    //   console.log('Debug - User is not a teacher');
    //   return false;
    // }
    
    // 대시보드가 이미 활성화되어 있으면 버튼을 표시하지 않음
    if (showDashboard) {
      console.log('Debug - Dashboard already open');
      return false;
    }
    
    // AI 채팅도우미 페이지에서만 버튼 표시
    const showOnlyOnConvAI = path.includes('/conv-ai');
    console.log('Debug - Is on /conv-ai path:', showOnlyOnConvAI);
    
    // 대시보드 뷰 또는 로그인/프로필 페이지에서는 버튼을 표시하지 않음
    const excludedRoutes = ['/login', '/profile', '/teacher-dashboard'];
    const shouldExclude = excludedRoutes.some(route => path.includes(route));
    
    // AI 채팅도우미 경로에서만 버튼 표시하고, 제외 경로에서는 표시하지 않음
    const shouldShow = showOnlyOnConvAI && !shouldExclude;
    console.log('Debug - Button should display:', shouldShow);
    return shouldShow;
  };
  
  // 대시보드 열기 핸들러
  const handleOpenDashboard = () => {
    const currentType = getDashboardTypeFromPath(location.pathname);
    setDashboardType(currentType);
    setShowDashboard(true);
  };
  
  // 대시보드 닫기 핸들러
  const handleCloseDashboard = () => {
    setShowDashboard(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex relative font-sans">
      {isLeftSideTabOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsLeftSideTabOpen(false)}
        ></div>
      )}
      
      <div 
        className={`fixed inset-y-0 left-0 w-80 transform ${isLeftSideTabOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-300 ease-in-out z-50 side-tab`}
        style={{
          background: '#f7f7f5',
          borderRight: 'solid 1px #c7c5bd',
        }}
      >
        <div className="p-6 pl-2 flex flex-col h-full" style={{ zIndex: 3000 }}>
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="text-gray-900 font-bold text-xl ml-3" onClick={() => setIsLeftSideTabOpen(false)}>T.R.I.P.O.D.</Link>
            <button onClick={() => setIsLeftSideTabOpen(false)} className="text-gray-500 hover:text-gray-700" style={{zIndex:3}}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="flex-grow">
            <li className="mb-1">
              <NavigationButton to="/rubric-report" text="📝 루브릭 레포트 AI" />
            </li>
            <li className="mb-1">
              <NavigationButton to="/image-analysis" text="🏠 이미지 평가 AI" />
            </li>
            <li className="mb-1">
              <NavigationButton to="/conv-ai" text="💬 AI 채팅 도우미" />
            </li>
            <li className="mb-1">
              <NavigationButton to="/idea-canvas" text="🎨 아이디어 캔버스 AI" />
            </li>
            <li className="mb-1">
              <NavigationButton to="/tpack-lesson" text="📚 TPACK 수업 설계" />
            </li>
            <li className="mb-1">
              <NavigationButton to="/student-evaluation" text="📊 학생 성적 평가 도구" />
            </li>
            {user && !studentSession && (
              <li className="mb-1">
                <NavigationButton to="/teacher-dashboard" text="📊 학생 채팅 대시보드" />
              </li>
            )}
          </ul>
          <div className="mt-auto text-sm font-bold text-gray-400 ml-4">
            2024. T.R.I.P.O.D.
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsLeftSideTabOpen(!isLeftSideTabOpen)}
        style={{ zIndex: 3 }}
        className="fixed left-4 top-4 z-50 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 transition duration-300 ease-in-out tab-toggle"
      >
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-grow">
        <header className="fix bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center items-center">
            {(user || studentSession) && (
              <UserMenu
                user={user}
                studentSession={studentSession}
                onLogout={handleLogout}
                onEditProfile={handleEditProfile}
              />
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/image-analysis" element={(user || studentSession) ? <ImageAnalysis /> : <Navigate to="/" />} />
            <Route path="/rubric-report" element={(user || studentSession) ? <RubricReportAI /> : <Navigate to="/" />} />
            <Route path="/conv-ai" element={(user || studentSession) ? <ConvAI /> : <Navigate to="/" />} />
            <Route path="/student-evaluation" element={(user || studentSession) ? <StudentEvaluation /> : <Navigate to="/" />} />
            <Route path="/idea-canvas" element={(user || studentSession) ? <IdeaCanvasAI /> : <Navigate to="/" />} />
            <Route path="/tpack-lesson" element={(user || studentSession) ? <TPACKLesson /> : <Navigate to="/" />} />
            <Route path="/teacher-dashboard" element={user && !studentSession ? <TeacherDashboard /> : <Navigate to="/" />} />
            <Route path="/" element={
              <HomePage 
                user={user} 
                studentSession={studentSession}
                setIsLoginModalOpen={setIsLoginModalOpen} 
                setIsModalOpen={setIsModalOpen}
                setIsStudentLoginModalOpen={setIsStudentLoginModalOpen}
                setShowLoginSuccess={setShowLoginSuccess}
                setLoginSuccessInfo={setLoginSuccessInfo}
                setRedirectPath={setRedirectPath}
                handleLogout={handleLogout}
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {isModalOpen && <Modal />}
      {isLoginModalOpen && 
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)} 
          onSignupClick={() => {
            setIsLoginModalOpen(false);
            setIsSignupModalOpen(true);
          }}
          setIsManualLogin={setIsManualLogin}
        />
      }
      {isSignupModalOpen && 
        <SignupModal 
          onClose={() => {
            setIsSignupModalOpen(false);
          }}
          onLoginClick={() => {
            setIsSignupModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      }
      {isStudentLoginModalOpen && 
        <SLoginModal 
          onClose={() => setIsStudentLoginModalOpen(false)}
          onLoginSuccess={handleStudentLoginSuccess}
          onTeacherLoginClick={() => {
            setIsStudentLoginModalOpen(false);
            setIsLoginModalOpen(true);
          }}
          setIsManualLogin={setIsManualLogin}
        />
      }
      {showLoginSuccess && (
        <LoginSuccessModal
          onClose={handleLoginSuccessClose}
          userType={loginSuccessInfo.userType}
          nickname={loginSuccessInfo.nickname}
        />
      )}
      {showLogoutModal && (
        <LoginSuccessModal
          onClose={() => setShowLogoutModal(false)}
          userType="logout"
          nickname=""
        />
      )}
      {isEditProfileModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditProfileModalOpen(false)}
          onUpdate={handleProfileUpdate}
          onDelete={handleProfileDelete}
        />
      )}
      {isLoginConfirmModalOpen && <LoginConfirmModal />}

      {/* 대시보드 버튼 (현재 경로에 따라 표시 여부 결정) */}
      {shouldShowDashboardButton(location.pathname) && (
        <DashboardButton 
          onClick={handleOpenDashboard}
          dashboardType={getDashboardTypeFromPath(location.pathname)}
        />
      )}
      
      {/* 대시보드 패널 */}
      <DashboardPanel 
        isOpen={showDashboard} 
        onClose={handleCloseDashboard}
        dashboardType={dashboardType}
      />
    </div>
  );
}

export default AppContent;