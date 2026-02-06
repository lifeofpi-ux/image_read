import React from 'react';

const PrivacyPolicyModal = ({ onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">개인정보 처리방침</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition duration-300"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 본문 내용 */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                    <div className="prose prose-sm max-w-none text-gray-700">
                        <p className="text-sm text-gray-500 mb-4">시행일자: 2026년 2월 4일 (개정)</p>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제1조 (총칙)</h3>
                            <p className="text-sm leading-relaxed">
                                'T.R.I.P.O.D. AI 도구'는 이용자의 동의를 기반으로 개인정보를 수집·이용 및 제공하고 있으며,
                                『개인정보 보호법』 등 관련 법령을 준수하여 정보주체의 개인정보를 안전하게 처리하고 있습니다.
                                'T.R.I.P.O.D. AI 도구'는 본 개인정보 처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와
                                방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                            </p>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제2조 (14세 미만 아동의 개인정보 보호)</h3>
                            <p className="text-sm leading-relaxed mb-2">
                                본 서비스는 14세 미만 아동의 개인정보 보호를 위해 직접 가입을 허용하지 않으며,
                                교사를 통한 간접 계정발급 및 가명 정보 활용을 원칙으로 합니다.
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                <li>'T.R.I.P.O.D. AI 도구'는 만 14세 미만 아동의 회원가입을 직접 받지 않습니다.</li>
                                <li>서비스 이용이 필요한 만 14세 미만 아동(학생)의 경우, 법정대리인 또는 교사의 클래스 정보 입력을 통해 서비스를 이용할 수 있습니다.</li>
                                <li>'T.R.I.P.O.D. AI 도구'는 아동의 개인정보를 수집하지 않기 위해 학생으로부터 별도의 이메일, 전화번호 등을 요구하지 않습니다.</li>
                            </ul>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제3조 (개인정보의 수집 항목 및 이용 목적)</h3>
                            <p className="text-sm leading-relaxed mb-3">
                                서비스 제공에 필요한 최소한의 정보만을 수집하며, 민감정보는 수집하지 않습니다.
                                'T.R.I.P.O.D. AI 도구'는 다음의 목적을 위하여 가입회원에 대한 최소한의 개인정보를 수집하고 처리합니다.
                            </p>

                            <h4 className="font-semibold text-gray-700 mb-2">1. 수집 항목</h4>
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                <p className="text-sm font-medium mb-1">교사 (관리자)</p>
                                <p className="text-xs text-gray-600">필수항목: 이메일 주소(아이디), 비밀번호(암호화), 성명(또는 닉네임, 사용자 선택)</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                <p className="text-sm font-medium mb-1">학생 (이용자)</p>
                                <p className="text-xs text-gray-600">수집하지 않음</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg mb-3">
                                <p className="text-sm font-medium text-red-700 mb-1">공통적으로 수집하지 않는 항목</p>
                                <p className="text-xs text-red-600">이름(실명), 전화번호, 주소, 주민등록번호 등 개인 식별 가능한 개인 고유 정보</p>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                * 자동 수집 항목: 단말기의 서비스 이용 로그, 접속 로그, 쿠키, 접속 IP 정보, 불량 이용 기록
                            </p>

                            <h4 className="font-semibold text-gray-700 mb-2">2. 이용 목적</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                <li>회원 가입 의사 확인 및 본인 식별</li>
                                <li>서비스 제공(학습 지원, AI 분석 도구 활용 등) 및 운영</li>
                                <li>서비스 부정이용 방지 및 비인가 사용 방지</li>
                                <li>문의사항 처리 및 공지사항 전달</li>
                            </ul>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제4조 (개인정보의 보유 및 이용 기간)</h3>
                            <p className="text-sm leading-relaxed mb-2">
                                이용 목적 달성 시 즉시 파기 원칙을 준수합니다.
                                'T.R.I.P.O.D. AI 도구'는 서비스 이용을 위해 수집된 최소한의 개인정보를 개인정보 수집 및 이용 목적이
                                달성된 후 지체 없이 파기합니다. 단, 다음의 정보는 명시한 기간 동안 보존합니다.
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                <li>교사 계정 정보: 회원 탈퇴 시까지</li>
                                <li>학생 활동 정보 및 계정: 교사가 '회원 탈퇴'를 하는 즉시 서버에서 영구적으로 삭제됩니다.</li>
                                <li>서비스 이용 기록: 3개월 (통신비밀보호법에 따름)</li>
                            </ul>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제5조 (개인정보의 제3자 제공 및 처리 위탁)</h3>
                            <p className="text-sm leading-relaxed mb-2">
                                원칙적으로 제3자 제공을 하지 않으며, 서비스 운영을 위한 필수적인 인프라 위탁만 진행합니다.
                                'T.R.I.P.O.D. AI 도구'는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우나 법령의 규정에 의거한 경우는 예외로 합니다.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs border border-gray-200 mt-2">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-gray-200 px-3 py-2 text-left">수탁업체</th>
                                            <th className="border border-gray-200 px-3 py-2 text-left">위탁 업무 내용</th>
                                            <th className="border border-gray-200 px-3 py-2 text-left">보유 기간</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-200 px-3 py-2">Google Cloud Platform (Firebase)</td>
                                            <td className="border border-gray-200 px-3 py-2">서비스 데이터베이스 호스팅 및 데이터 저장, 인증 관리</td>
                                            <td className="border border-gray-200 px-3 py-2">회원 탈퇴 시 즉시 파기</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제6조 (정보주체의 권리·의무 및 행사 방법)</h3>
                            <p className="text-sm leading-relaxed mb-2">
                                이용자는 언제든지 자신의 정보를 열람, 정정, 삭제할 수 있는 권리를 보장받습니다.
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                <li>이용자(교사)는 언제든지 자신의 개인정보를 열람하거나 수정할 수 있으며, 회원 탈퇴(가입 해지)를 요청할 수 있습니다.</li>
                                <li>이용자는 서비스 내 [설정] &gt; [프로필 수정] 또는 [회원 탈퇴] 메뉴를 통해 개인정보를 직접 관리할 수 있습니다.</li>
                                <li>'T.R.I.P.O.D. AI 도구'는 이용자의 권리 행사가 있을 경우 지체 없이 조치합니다.</li>
                            </ul>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제7조 (개인정보의 파기 절차 및 방법)</h3>
                            <p className="text-sm leading-relaxed mb-2">
                                'T.R.I.P.O.D. AI 도구'는 원칙적으로 개인정보 처리 목적이 달성된 경우에는 지체 없이 해당 개인정보를 파기합니다.
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                <li><strong>파기 절차:</strong> 이용자가 입력한 정보는 목적 달성 후 즉시 DB에서 삭제됩니다. 별도의 DB로 옮겨져 보관되지 않습니다.</li>
                                <li><strong>파기 방법:</strong> 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 기술적 방법을 사용하여 영구 삭제합니다.</li>
                            </ul>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제8조 (개인정보의 안전성 확보 조치)</h3>
                            <p className="text-sm leading-relaxed mb-2">
                                개인정보보호법 제29조에 따라 안전성 확보에 필요한 기술적/관리적 조치를 하고 있습니다.
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                                <li><strong>개인정보의 암호화:</strong> 이용자의 비밀번호는 단방향 암호화되어 저장되므로 'T.R.I.P.O.D. AI 도구'도 알 수 없습니다.</li>
                                <li><strong>해킹 등에 대비한 기술적 대책:</strong> 보안이 강화된 Google Cloud 보안 인프라를 사용하며, SSL(HTTPS) 인증서를 통해 구간 암호화 통신을 의무화하고 있습니다.</li>
                                <li><strong>취급 직원의 최소화 및 교육:</strong> 개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</li>
                            </ul>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제9조 (개인정보 보호책임자)</h3>
                            <p className="text-sm leading-relaxed mb-2">
                                개인정보 처리에 관한 업무를 총괄해서 책임지고, 관련 고충처리를 위해 아래와 같이 책임자를 지정하고 있습니다.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-blue-800 mb-2">[개인정보 보호책임자]</p>
                                <ul className="text-sm space-y-1 text-blue-700">
                                    <li>성명: 이상선</li>
                                    <li>연락처: indend007@gmail.com</li>
                                </ul>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                * 그 밖의 개인정보 침해에 대한 상담은 개인정보침해신고센터(국번없이 118)를 통해 받을 수 있습니다.
                            </p>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제10조 (사용자의 의무 및 책임)</h3>
                            <p className="text-sm leading-relaxed mb-2 text-red-600 font-medium">
                                [중요: 서비스 사용자 필독]
                            </p>
                            <p className="text-sm leading-relaxed mb-2">
                                본 서비스는 교사(사용자)가 주도적으로 학생 데이터를 관리하는 서비스입니다.
                                교사(사용자)는 피사용자(학생)의 개인정보 보호를 위해 다음과 같은 의무를 준수해야 합니다.
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-2 ml-2">
                                <li>교사(사용자)는 학생 활용시, 학생을 식별할 수 있는 과도한 개인정보(주민 번호, 집 주소, 개인 휴대전화 번호 등)를 '이름'이나 '닉네임' 란에 입력해서는 안 됩니다.</li>
                                <li>교사(사용자)는 본인의 계정 비밀번호가 유출되지 않도록 철저히 관리해야 하며, 비밀번호 유출로 인한 학생 데이터 유출 사고에 대한 1차적 책임은 교사(사용자) 본인에게 있습니다.</li>
                            </ul>
                        </section>

                        <section className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">제11조 (개인정보처리방침의 변경)</h3>
                            <p className="text-sm leading-relaxed">
                                이 개인정보처리방침은 2026년 2월 4일부터 적용됩니다. 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는
                                변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                            </p>
                        </section>

                        <section className="bg-green-50 p-4 rounded-lg mb-10">
                            <h3 className="text-sm font-bold text-green-800 mb-2">「초·중등교육법」 제29조의2 기준 충족 안내</h3>
                            <p className="text-xs text-green-700">
                                본 개인정보처리방침은 「초·중등교육법」 제29조의2에 따른, 학습지원 소프트웨어 선정 기준 및 가이드라인을 준수합니다.
                            </p>
                        </section>

                        {/* 체크리스트 양식 추가 */}
                        <div className="mt-12 p-8 bg-white border border-gray-300 rounded-sm shadow-sm font-sans text-gray-900">
                            <h2 className="text-2xl font-bold text-center mb-8 underline underline-offset-8 decoration-1">
                                학습지원 소프트웨어 필수기준 체크리스트[공급자용]
                            </h2>

                            <div className="mb-6">
                                <h3 className="text-lg font-bold flex items-center mb-3">
                                    <span className="inline-block w-4 h-4 border border-black mr-2"></span> 제품/서비스 개요
                                </h3>
                                <table className="w-full border-collapse border border-black text-sm">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black bg-gray-200 px-3 py-2 font-bold w-1/4 text-center">제품/서비스명</td>
                                            <td className="border border-black px-3 py-2 w-1/4 text-center">T.R.I.P.O.D. AI Tools</td>
                                            <td className="border border-black bg-gray-200 px-3 py-2 font-bold w-1/4 text-center">공급자</td>
                                            <td className="border border-black px-3 py-2 w-1/4 text-center">이상선</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black bg-gray-200 px-3 py-2 font-bold text-center">접속경로</td>
                                            <td colSpan="3" className="border border-black px-3 py-2 italic text-gray-700">
                                                * PC웹/앱 : <a href="https://tripodtools.netlify.app" className="underline text-blue-600">https://tripodtools.netlify.app</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black bg-gray-200 px-3 py-2 font-bold text-center">주요 내용 및<br />기능·특장점</td>
                                            <td colSpan="3" className="border border-black px-3 py-2">
                                                다양한 AI 기반 수업 도구들을 제공함(교사가 관리 가능한 AI 챗봇 등)
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-bold flex items-center mb-3">
                                    <span className="inline-block w-4 h-4 border border-black mr-2"></span> 개인정보보호 기준 충족여부
                                </h3>
                                <table className="w-full border-collapse border border-black text-xs text-center">
                                    <thead className="bg-gray-200 font-bold">
                                        <tr>
                                            <th rowSpan="2" className="border border-black px-1 py-4 w-[15%]">선정기준</th>
                                            <th rowSpan="2" className="border border-black px-1 py-4 w-[40%]">세부 내용</th>
                                            <th colSpan="3" className="border border-black px-1 py-1">확인</th>
                                            <th rowSpan="2" className="border border-black px-1 py-4 w-[20%]">증빙</th>
                                        </tr>
                                        <tr>
                                            <th className="border border-black px-1 py-1 w-[8%] text-[10px]">충족</th>
                                            <th className="border border-black px-1 py-1 w-[8%] text-[10px]">미충족</th>
                                            <th className="border border-black px-1 py-1 w-[9%] text-[10px]">해당<br />없음</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* 1. 최소처리 원칙 준수 */}
                                        <tr>
                                            <td rowSpan="3" className="border border-black px-2 py-2 font-bold text-center bg-gray-50">1. 최소처리<br />원칙 준수</td>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">1-1. 개인정보가 최소한으로 수집되는가?</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제3조</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">1-2. 개인정보 수집·이용 목적이 기재되어<br />있는가?</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제3조</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">1-3. 개인정보 수집항목, 보유기간 등이<br />기재되어 있는가?</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제3,4조</td>
                                        </tr>

                                        {/* 2. 개인정보 안전조치 의무 */}
                                        <tr>
                                            <td className="border border-black px-2 py-2 font-bold text-center bg-gray-50">2. 개인정보<br />안전조치 의무</td>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">2-1. 개인정보 안전성 확보에 필요한 조치<br />사항이 기재되어 있는가?</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제8조</td>
                                        </tr>

                                        {/* 3. 열람/정정/삭제/처리정지 절차 */}
                                        <tr>
                                            <td className="border border-black px-2 py-2 font-bold text-center bg-gray-50">3. 열람/정정/<br />삭제/처리정지<br />절차</td>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">3-1. 이용자에게 언제든지 자신의 정보를<br />열람·정정·삭제·처리정지를 요구할 수<br />있는 절차가 안내되어 있는가?</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제5조</td>
                                        </tr>

                                        {/* 4. 만14세 미만 아동의 개인정보 보호 */}
                                        <tr>
                                            <td className="border border-black px-2 py-2 font-bold text-center bg-gray-50">4. 만14세<br />미만 아동의<br />개인정보 보호</td>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">4-1. 만 14세 미만 아동의 경우 법정대리인<br />동의 등 아동의 개인정보 보호를 위한<br />절차가 마련되어 있는가?</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제6조</td>
                                        </tr>

                                        {/* 5. 보호책임자/제3자제공/위탁 등 */}
                                        <tr>
                                            <td rowSpan="3" className="border border-black px-2 py-2 font-bold text-center bg-gray-50">5.<br />보호책임자/<br />제3자제공/<br />위탁 등</td>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">5-1. 개인정보 보호책임자 관련 정보가<br />안내되어 있는가?</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제9조</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">5-2. 개인정보 제3자 제공에 관한 정보가<br />기재되어 있는가? (필요시)</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제5조</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-3 py-2 text-left bg-gray-50">5-3. 개인정보 위·수탁관계에 관한 정보가<br />기재되어 있는가? (필요시)</td>
                                            <td className="border border-black px-1 py-2 font-bold text-lg">▣</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-1 py-2 text-lg text-gray-300">□</td>
                                            <td className="border border-black px-2 py-2 bg-gray-50">개인정보<br />처리방침 제5조</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="text-[11px] mt-2 text-gray-600">
                                    ※ 개인정보처리방침 확인 방법 : <a href="https://tripodtools.netlify.app/" className="underline">https://tripodtools.netlify.app/</a> 하단 개인정보 처리 방침
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold flex items-center mb-3">
                                    <span className="inline-block w-4 h-4 border border-black mr-2"></span> 작성일 및 문의처
                                </h3>
                                <table className="w-full border-collapse border border-black text-sm">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black bg-gray-200 px-3 py-2 font-bold w-1/4 text-center">작성일</td>
                                            <td className="border border-black px-3 py-2 text-center font-semibold">2026.02.04</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black bg-gray-200 px-3 py-2 font-bold text-center">문의처</td>
                                            <td className="border border-black px-3 py-2">
                                                <div className="flex justify-around">
                                                    <span><strong>(전화)</strong> 010-3893-2858</span>
                                                    <span><strong>(이메일)</strong> indend007@gmail.com</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
