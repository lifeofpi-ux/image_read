import React, { useState, useEffect, useCallback } from 'react';
import './TPACKLesson.css';

import Card from './Card';
import AddCardModal from './AddCardModal';
import EditCardModal from './EditCardModal';
import CombineModal from './CombineModal';
import EditRowModal from './EditRowModal';
import EditCourseTitleModal from './EditCourseTitleModal';
import LessonPlanModal from './LessonPlanModal';
import PeopleModal from './PeopleModal';
import ErrorModal from './ErrorModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaSave, FaPlus, FaInfoCircle } from 'react-icons/fa';

const CK_OPTIONS = [
  "생물학 (초등): 동물과 식물의 기본 구조와 생명 활동, 환경과 생태계의 기본 개념을 이해.",
  "생물학 (중등): 세포의 구조와 기능, 생물의 분류 체계, 생태계와 환경의 상호작용에 대한 교육.",
  "화학 (초등): 물질의 상태 변화, 간단한 화학 반응, 일상에서 볼 수 있는 화학 현상을 설명.",
  "화학 (중등): 원자와 분자의 기본 구조, 주기율표, 화학 반응의 기본 원리 설명.",
  "물리학 (초등): 힘과 운동, 소리와 빛의 기본 원리, 일상생활 속 물리 현상 이해.",
  "물리학 (중등): 힘과 운동의 법칙, 에너지의 형태와 보존, 전기와 자기의 기본 원리 교육.",
  "역사 (초등): 중요한 역사적 인물과 사건, 기본적인 시간 개념과 역사적 연대기 이해.",
  "역사 (중등): 고대 문명 (메소포타미아, 이집트, 인더스, 중국 등)의 사회 구조, 문화, 경제적 활동 설명.",
  "지리학 (초등): 지구의 기본 구조, 대륙과 대양, 날씨와 기후의 기본 개념.",
  "지리학 (중등): 물리적 지리 (대기와 날씨, 지형과 지질, 수자원과 기후), 인문 지리 (인구 분포와 이동, 도시와 농촌의 특성, 경제 활동과 자원 분포)"
];

const PK_OPTIONS = [
  "수업 계획 지원: 효율적인 수업 설계를 위한 전략과 방법론 제공.",
  "학생 참여 유도: 학생들의 참여를 높이기 위한 다양한 교육 방법 적용.",
  "학습 평가: 평가의 목적과 다양한 평가 방법 이해 및 적용.",
  "교실 관리 기술: 효율적인 교실 관리와 학생 행동 관리 기술.",
  "협동 학습: 학생들 간의 협력을 촉진하는 학습 활동 설계.",
  "문제 해결 중심 학습: 학생들이 문제 해결 능력을 기르기 위한 학습 활동 계획.",
  "프로젝트 학습: 프로젝트 기반 학습을 효과적으로 운영하기 위한 방법론.",
  "자기주도 학습: 학생들이 스스로 학습 목표를 설정하고 달성할 수 있도록 지도.",
  "학생 피드백 제공: 효과적인 피드백을 제공하는 방법과 전략.",
  "교육 평가: 다양한 형식의 평가 도구와 방법을 통해 교육 평가의 다변화."
];

const TK_OPTIONS = [
  "온라인 수업 도구: 화상 수업, 온라인 토론 등을 위한 다양한 도구 제공. (AI DT)",
  "온라인 퀴즈 도구: 다양한 형식의 온라인 퀴즈 제공으로 학습 효과 증대. (AI DT)",
  "개별 학습 경로 제공: 학생별 맞춤형 학습 경로를 설계하여 제공. (AI DT)",
  "프로젝트 학습 지원: 프로젝트 기반 학습을 위한 자료 및 도구 제공. (AI DT)",
  "협력 학습 지원: 학생 간 협력 학습을 촉진하기 위한 기능 제공. (AI DT)",
  "가정 학습 지원: 가정에서 학습할 수 있는 다양한 자료와 학습 계획 제공. (AI DT)",
  "학습자 인터랙티브 매뉴얼: 학생이 디지털 교과서를 효과적으로 활용할 수 있도록 도움. (AI DT)",
  "학습 데이터 분석: 학생들의 학습 데이터를 분석하여 맞춤형 학습 전략 제공. (AI DT)",
  "성취도 분석: 학습 성취도를 분석하여 학생의 강점과 약점을 파악. (AI DT)",
  "학부모 대시보드: 학부모가 자녀의 학습 상황을 쉽게 확인할 수 있도록 지원. (AI DT)",
  "다국어 지원: 다양한 언어로 학습 콘텐츠와 지원 도구 제공. (AI DT)",
  "보안 및 개인정보 보호: 학습자의 개인정보를 안전하게 보호하고 관리. (AI DT)"
];

const TPACK_OPTIONS = [
  "물리학 시뮬레이션: 물리학 개념을 시뮬레이션 소프트웨어로 설명하고 학습. (AI DT)",
  "역사적 가상 체험: 가상 현실을 통해 역사적 사건을 체험하게 하여 학습 이해도 향상.",
  "디지털 스토리텔링: 문학 작품을 디지털 스토리텔링 도구로 재창작.",
  "수학 인터랙티브 화이트보드: 수학 문제 해결 과정을 인터랙티브 화이트보드로 시연. (AI DT)",
  "과학 데이터 로그: 데이터 로그 장치를 사용하여 실험 결과를 실시간 분석. (AI DT)",
  "디지털 미디어 창작: 예술 수업에서 디지털 미디어를 사용해 학생들이 작품을 창작.",
  "경제 시뮬레이션 게임: 경제 원리를 이해하기 위해 시뮬레이션 게임 활용.",
  "웨어러블 기기 활용: 체육 수업에서 웨어러블 기기를 사용해 운동 성과 추적.",
  "디지털 작곡 소프트웨어: 음악 수업에서 디지털 작곡 소프트웨어로 음악 창작. (AI DT)",
  "언어 학습 앱: 외국어 학습 시 언어 학습 앱을 사용해 발음 및 어휘 학습 지원. (AI DT)"
];

const getRandomCard = (type, rowId) => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  rowId: rowId,
  label: type,
  text: type === 'TK' ? TK_OPTIONS[Math.floor(Math.random() * TK_OPTIONS.length)] :
        type === 'PK' ? PK_OPTIONS[Math.floor(Math.random() * PK_OPTIONS.length)] :
        type === 'CK' ? CK_OPTIONS[Math.floor(Math.random() * CK_OPTIONS.length)] :
        TPACK_OPTIONS[Math.floor(Math.random() * TPACK_OPTIONS.length)],
  color: type === 'TK' ? 'pink' : type === 'PK' ? 'lightyellow' : type === 'CK' ? 'lightgreen' : 'lightpurple'
});

const TPACKLesson = () => {
  const [courseTitle, setCourseTitle] = useState('🍀 수업 제목');
  const [rows, setRows] = useState([{ id: '1', number: 1, description: '수업 흐름을 입력하세요.' }]);
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [isCombineModalOpen, setIsCombineModalOpen] = useState(false);
  const [isEditRowModalOpen, setIsEditRowModalOpen] = useState(false);
  const [isEditCourseTitleModalOpen, setIsEditCourseTitleModalOpen] = useState(false);
  const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false);
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentCard, setCurrentCard] = useState(null);
  const [currentRowId, setCurrentRowId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    const savedData = JSON.parse(localStorage.getItem('tpackLessonData'));
    if (savedData) {
      setCourseTitle(savedData.savedCourseTitle);
      setRows(savedData.savedRows);
      setCards(savedData.savedCards);
    } else {
      setRows([{ id: '1', number: 1, description: '수업 흐름을 입력하세요.' }]);
      const initialCards = [
        getRandomCard('TK', '1'),
        getRandomCard('PK', '1'),
        getRandomCard('CK', '1'),
        getRandomCard('TPACK', '1')
      ];
      setCards(initialCards);
    }
  };

  const saveData = useCallback(() => {
    console.log('Saving data to localStorage');
    localStorage.setItem(
      'tpackLessonData',
      JSON.stringify({
        savedCourseTitle: courseTitle,
        savedRows: rows,
        savedCards: cards,
      })
    );
  }, [courseTitle, rows, cards]);

  useEffect(() => {
    saveData();
  }, [courseTitle, rows, cards, saveData]);

  const addRow = () => {
    console.log('Adding new row');
    const newRow = {
      id: Date.now().toString(),
      number: rows.length + 1,
      description: '수업 흐름을 입력하세요.',
    };
    setRows([...rows, newRow]);
  };

  const addCard = (cardData) => {
    console.log('Adding new card:', cardData);
    let newCardText = cardData.text;
    
    // 카드 내용이 비어있으면 랜덤한 프리셋 내용 할당
    if (!newCardText || newCardText.trim() === '') {
      const options = cardData.color === 'pink' ? TK_OPTIONS :
                      cardData.color === 'lightyellow' ? PK_OPTIONS :
                      cardData.color === 'lightgreen' ? CK_OPTIONS :
                      TPACK_OPTIONS;
      newCardText = options[Math.floor(Math.random() * options.length)];
    }
    
    const newCard = {
      id: Date.now().toString(),
      rowId: currentRowId,
      ...cardData,
      text: newCardText,
    };
    setCards([...cards, newCard]);
    setIsAddCardModalOpen(false);
  };

  const updateCard = (cardId, updatedData) => {
    console.log('Updating card:', cardId, updatedData);
    setCards(cards.map((card) => (card.id === cardId ? { ...card, ...updatedData } : card)));
    setIsEditCardModalOpen(false);
  };

  const deleteCard = (cardId) => {
    console.log('Deleting card:', cardId);
    setCards(cards.filter((card) => card.id !== cardId));
    // 선택된 카드에서 삭제된 카드 제거
    setSelectedCards(selectedCards.filter((card) => card.id !== cardId));
  };

  const updateRow = (rowId, updatedDescription) => {
    console.log('Updating row:', rowId, updatedDescription);
    setRows(rows.map((row) => (row.id === rowId ? { ...row, description: updatedDescription } : row)));
  };

  const deleteRow = (rowId) => {
    console.log('Deleting row:', rowId);
    const rowToDelete = rows.find((row) => row.id === rowId);
    if (rowToDelete.number !== rows.length) {
      setErrorMessage('마지막 수업 흐름만 삭제할 수 있습니다.');
      setIsErrorModalOpen(true);
      return;
    }
    setRows(rows.filter((row) => row.id !== rowId));
    setCards(cards.filter((card) => card.rowId !== rowId));
    // 삭제된 행에 속한 카드들을 선택된 카드 목록에서도 제거
    setSelectedCards(selectedCards.filter((card) => card.rowId !== rowId));
  };

  const handleCardSelect = (card) => {
    console.log('Selecting card:', card);
    if (selectedCards.some((c) => c.rowId !== card.rowId)) {
      setErrorMessage('같은 수업 흐름의 카드를 선택해주세요.');
      setIsErrorModalOpen(true);
      return;
    }
    if (selectedCards.some((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  useEffect(() => {
    console.log('Selected cards:', selectedCards);
  }, [selectedCards]);

  const combineCards = (combinedCardData) => {
    console.log('Combining cards into:', combinedCardData);
    const newCard = {
      id: Date.now().toString(),
      ...combinedCardData
    };
    setCards(prevCards => [...prevCards, newCard]);
    setCards(prevCards => prevCards.filter(card => !selectedCards.some(selectedCard => selectedCard.id === card.id)));
    setSelectedCards([]);
    setIsCombineModalOpen(false);
  };

  const generateLessonPlan = () => {
    let plan = `수업 제목: ${courseTitle}\n\n`;
    rows.forEach((row, index) => {
      plan += `수업흐름 ${index + 1}: ${row.description}\n`;
      const rowCards = cards.filter((card) => card.rowId === row.id);
      rowCards.forEach((card) => {
        plan += `${card.label}: ${card.text}\n`;
      });
      plan += '\n';
    });
    return plan;
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
  
    const destRowId = result.destination.droppableId;
  
    const newCards = Array.from(cards);
    const [reorderedCard] = newCards.splice(result.source.index, 1);
    reorderedCard.rowId = destRowId;
    newCards.splice(result.destination.index, 0, reorderedCard);
  
    setCards(newCards);
  };
  

  return (
    <div className="tpack-lesson-container flex flex-col justify-start items-center p-10 min-h-screen w-full bg-cover bg-repeat bg-center text-black">
      <h1 className="course-title text-2xl font-bold mb-4 cursor-pointer mt-12 text-brown" onClick={() => setIsEditCourseTitleModalOpen(true)}>
        {courseTitle}
      </h1>
      <div className="title text-lg text-gray-600 mb-5">TPACK 모델을 활용한 수업 설계 도구</div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="container flex flex-col gap-5 mt-5">
          {rows.map((row, index) => (
            <Droppable key={row.id} droppableId={row.id} direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="row flex flex-col gap-2 relative my-4">
                  <div
                    className="row-header flex items-center gap-2 cursor-pointer mb-2"
                    onClick={() => {
                      setCurrentRowId(row.id);
                      setIsEditRowModalOpen(true);
                    }}
                  >
                    <div className="row-number bg-teal-500 text-white rounded-full w-8 h-8 flex justify-center items-center text-xl">{index + 1}</div>
                    <div className="row-description bg-white bg-opacity-60 rounded-lg p-2 text-black" style={{ whiteSpace: 'break-spaces' }}>{row.description}</div>
                  </div>
                  <div className="card-row flex items-center gap-5">
                    {cards
                      .filter((card) => card.rowId === row.id)
                      .map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card
                                card={card}
                                onEdit={() => {
                                  setCurrentCard(card);
                                  setIsEditCardModalOpen(true);
                                }}
                                onSelect={() => handleCardSelect(card)}
                                isSelected={selectedCards.some((c) => c.id === card.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                    <button className="add-card-btn text-white flex hover:bg-blue-500 justify-center items-center text-base cursor-pointer" onClick={() => {
                      console.log('Add Card button clicked');
                      setCurrentRowId(row.id);
                      setIsAddCardModalOpen(true);
                    }}>
                      <FaPlus />
                    </button>
                    {selectedCards.length >= 2 && selectedCards[0].rowId === row.id && (
                      <button className="link-icon-btn text-white text-2xl cursor-pointer" onClick={() => setIsCombineModalOpen(true)}>
                        🔗
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <div className="bottom-bar-container flex justify-center w-full mt-5">
        <div className="bottom-bar flex gap-4 p-4 bg-white bg-opacity-80 rounded-xl shadow-lg">
          <button onClick={() => setIsLessonPlanModalOpen(true)} className="btn btn-success text-black flex justify-center items-center text-base cursor-pointer hover:text-blue-500">
            <FaSave />
          </button>
          <button onClick={addRow} className="add-row-btn text-black flex justify-center items-center text-base cursor-pointer hover:text-blue-500">
            <FaPlus />
          </button>
          <button onClick={() => setIsPeopleModalOpen(true)} className="btn btn-success text-black flex justify-center items-center text-base cursor-pointer hover:text-blue-500">
            <FaInfoCircle />
          </button>
        </div>
      </div>

      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onAddCard={addCard}
      />

      <EditCardModal
        isOpen={isEditCardModalOpen}
        onClose={() => setIsEditCardModalOpen(false)}
        onSave={updateCard}
        onDelete={() => deleteCard(currentCard ? currentCard.id : '')}
        card={currentCard}
      />

      <CombineModal
        isOpen={isCombineModalOpen}
        onClose={() => setIsCombineModalOpen(false)}
        selectedCards={selectedCards}
        onCombine={combineCards}
      />

      <EditRowModal
        isOpen={isEditRowModalOpen}
        onClose={() => setIsEditRowModalOpen(false)}
        onSave={updateRow}
        onDelete={deleteRow}
        row={rows.find((row) => row.id === currentRowId)}
      />

      <EditCourseTitleModal
        isOpen={isEditCourseTitleModalOpen}
        onClose={() => setIsEditCourseTitleModalOpen(false)}
        onSave={setCourseTitle}
        currentTitle={courseTitle}
      />

      <LessonPlanModal
        isOpen={isLessonPlanModalOpen}
        onClose={() => setIsLessonPlanModalOpen(false)}
        lessonPlan={generateLessonPlan()}
      />

      <PeopleModal isOpen={isPeopleModalOpen} onClose={() => setIsPeopleModalOpen(false)} />

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default TPACKLesson;
