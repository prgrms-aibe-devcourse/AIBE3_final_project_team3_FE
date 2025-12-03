import { PromptListItem } from "@/global/types/prompt.types";

export interface AIScenario {
  id: number | string;
  title: string;
  description?: string;
  promptType?: string;
  rolePlayType?: string;
}

export interface AICategory {
  id: string;
  title: string;
  promptType?: string;
  rolePlayType?: string;
  scenarios: AIScenario[];
}

const ROLE_PLAY_TYPE_KEYS = [
  "DAILY_SERVICE",
  "WORK_COMPANY",
  "SCHOOL_ACADEMIC",
  "TRAVEL_IMMIGRATION",
  "HOSPITAL_EMERGENCY",
  "ONLINE_DIGITAL",
  "RELATION_EMOTION",
  "META_LEARNING",
  "FREE_TALK",
] as const;

type RolePlayTypeKey = (typeof ROLE_PLAY_TYPE_KEYS)[number];

const ROLE_PLAY_TYPE_LABELS: Record<RolePlayTypeKey, string> = {
  DAILY_SERVICE: "일상 & 서비스 상황",
  WORK_COMPANY: "회사/직장 상황",
  SCHOOL_ACADEMIC: "학교/학습 상황",
  TRAVEL_IMMIGRATION: "여행 & 공항/이민 상황",
  HOSPITAL_EMERGENCY: "병원 & 긴급 상황",
  ONLINE_DIGITAL: "온라인/디지털 상황",
  RELATION_EMOTION: "인간관계 & 감정/갈등 상황",
  META_LEARNING: "영어 학습 앱 특화 메타 상황",
  FREE_TALK: "자유 대화 (Free Talk)",
};

const ROLE_PLAY_TYPE_KEY_SET = new Set<string>(ROLE_PLAY_TYPE_KEYS);

const FALLBACK_CATEGORY_KEY = "UNCATEGORIZED";

const toTitleCaseLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const normaliseRolePlayTypeKey = (rolePlayType?: string | null) => {
  if (typeof rolePlayType !== "string") {
    return FALLBACK_CATEGORY_KEY;
  }

  const trimmed = rolePlayType.trim();
  if (!trimmed) {
    return FALLBACK_CATEGORY_KEY;
  }

  const upper = trimmed.toUpperCase();
  return upper;
};

export const formatRolePlayTypeLabel = (rolePlayType?: string | null) => {
  const normalised = normaliseRolePlayTypeKey(rolePlayType);
  if (normalised === FALLBACK_CATEGORY_KEY) {
    return "기타 상황극 프롬프트";
  }

  if (ROLE_PLAY_TYPE_KEY_SET.has(normalised as RolePlayTypeKey)) {
    return ROLE_PLAY_TYPE_LABELS[normalised as RolePlayTypeKey];
  }

  return toTitleCaseLabel(normalised);
};

export const buildCategoriesFromPromptList = (
  promptList?: PromptListItem[] | null,
): AICategory[] => {
  if (!Array.isArray(promptList) || promptList.length === 0) {
    return [];
  }

  const scenarioMap = new Map<string, AIScenario[]>();
  ROLE_PLAY_TYPE_KEYS.forEach((key) => {
    scenarioMap.set(key, []);
  });
  scenarioMap.set(FALLBACK_CATEGORY_KEY, []);

  for (const prompt of promptList) {
    const normalisedKey = normaliseRolePlayTypeKey(prompt.rolePlayType);
    if (!scenarioMap.has(normalisedKey)) {
      scenarioMap.set(normalisedKey, []);
    }

    const slot = scenarioMap.get(normalisedKey);
    if (!slot) {
      continue;
    }

    slot.push({
      id: prompt.id,
      title: prompt.title,
      promptType: prompt.promptType,
      rolePlayType: normalisedKey === FALLBACK_CATEGORY_KEY ? undefined : normalisedKey,
    });
  }

  const categories: AICategory[] = ROLE_PLAY_TYPE_KEYS.map((key, index) => ({
    id: `${key.toLowerCase()}-${index + 1}`,
    title: ROLE_PLAY_TYPE_LABELS[key],
    rolePlayType: key,
    scenarios: scenarioMap.get(key) ?? [],
  }));

  const fallbackScenarios = scenarioMap.get(FALLBACK_CATEGORY_KEY) ?? [];
  if (fallbackScenarios.length > 0) {
    categories.push({
      id: `others-${categories.length + 1}`,
      title: formatRolePlayTypeLabel(FALLBACK_CATEGORY_KEY),
      rolePlayType: undefined,
      scenarios: fallbackScenarios,
    });
  }

  scenarioMap.forEach((scenarios, key) => {
    if (
      key === FALLBACK_CATEGORY_KEY ||
      ROLE_PLAY_TYPE_KEY_SET.has(key as RolePlayTypeKey)
    ) {
      return;
    }

    categories.push({
      id: `${key.toLowerCase()}-${categories.length + 1}`,
      title: formatRolePlayTypeLabel(key),
      rolePlayType: key,
      scenarios,
    });
  });

  return categories;
};

export const AI_SITUATION_CATEGORIES: AICategory[] = [
  {
    id: "daily_service",
    title: "1. 일상 & 서비스 상황",
    scenarios: [
      { id: "cafe", title: "☕ 카페 직원 – 손님" },
      { id: "restaurant", title: "️ 레스토랑 서버 – 손님", description: "주문하기, 메뉴 추천받기, 음식 문제 제기(너무 짜요, 차가워요 등)" },
      { id: "mart", title: "마트/편의점 점원 – 손님", description: "물건 위치 묻기, 환불/교환 요청" },
      { id: "hotel", title: "호텔 리셉션 – 투숙객", description: "체크인/체크아웃, 방 바꿔달라 요청, 추가 수건/물 달라고 하기" },
      { id: "taxi", title: "택시/우버 기사 – 승객", description: "목적지 설명, 경로 변경, 요금 관련 질문" },
      { id: "roommate", title: "‍‍ 룸메이트 A – 룸메이트 B", description: "청소, 소음, 생활 습관 등 조율 (갈등 + 협상 표현 연습하기 딱 좋음)" },
      { id: "neighbor", title: "️ 이웃 – 이웃", description: "층간 소음, 택배 잘못 배송, 인사/가벼운 잡담" },
    ],
  },
  {
    id: "company_work",
    title: "2. 회사/직장 상황",
    scenarios: [
      { id: "interview", title: "면접관 – 지원자", description: "자기소개, 경력 설명, 프로젝트 설명, 약점/강점 말하기" },
      { id: "junior_senior_dev", title: "‍ 주니어 개발자 – 시니어 개발자", description: "코드 리뷰 받기, 질문하기, 피드백에 답변하기" },
      { id: "pm_dev_designer", title: "PM – 개발자/디자이너", description: "요구사항 정리, 일정 협의, 범위 조정(스코프 크리핑 대응)" },
      { id: "client_freelancer", title: "‍ 클라이언트 – 프리랜서/에이전시", description: "요구사항 파악, 견적 설명, 기능 조정 협상" },
      { id: "sales_cs_customer", title: "세일즈/CS 직원 – 고객", description: "제품 설명, 기능 비교, 클레임 응대, 환불/보상 협상" },
      { id: "boss_subordinate", title: "상사 – 부하직원", description: "업무 보고, 일정 딜레이 설명, 피드백 받기, 연봉/승진 얘기(난이도 高)" },
    ],
  },
  {
    id: "school_learning",
    title: "3. 학교/학습 상황",
    scenarios: [
      { id: "teacher_student", title: "‍ 선생님 – 학생", description: "숙제 질문, 이해 안 되는 부분 설명 요청, 시험 일정/범위 확인" },
      { id: "study_leader_member", title: "스터디 리더 – 스터디원", description: "오늘 공부 계획, 발표 순서 정하기, 숙제 점검" },
      { id: "professor_student", title: "교수 – 대학생", description: "오피스 아워에서 질문, 과제 기한 연장 부탁하기(정중한 표현 연습)" },
      { id: "team_leader_member", title: "팀플 리더 – 팀원", description: "역할 분배, 책임 문제, 발표 준비 조율, 열심히 안 하는 팀원과 대화" },
    ],
  },
  {
    id: "travel_airport_immigration",
    title: "4. 여행 & 공항/이민 상황",
    scenarios: [
      { id: "airport_checkin", title: "공항 체크인 직원 – 승객", description: "짐 부치기, 좌석 변경 요청, 오버 차지 설명" },
      { id: "immigration_officer_traveler", title: "출입국 심사관 – 여행자", description: "방문 목적, 체류 기간, 숙소 설명" },
      { id: "lost_found_passenger", title: "유실물 센터/항공사 – 승객", description: "짐 분실 신고, 찾는 과정 문의" },
      { id: "traveler_local", title: "️ 길 묻는 여행자 – 현지인", description: "길 안내, 대중교통/환승 질문" },
      { id: "station_staff_passenger", title: "기차역/버스 터미널 직원 – 승객", description: "시간표 묻기, 표 예매/변경/환불" },
    ],
  },
  {
    id: "hospital_emergency",
    title: "5. 병원 & 긴급 상황",
    scenarios: [
      { id: "doctor_patient", title: "의사 – 환자", description: "증상 설명, 통증 정도 말하기, 병력/약 알레르기 말하기" },
      { id: "nurse_reception_patient", title: "‍⚕️ 간호사/접수 – 환자", description: "접수하기, 보험 이야기, 대기 시간 안내" },
      { id: "pharmacist_customer", title: "약사 – 손님", description: "약 추천받기, 복용법/부작용 문의" },
    ],
  },
  {
    id: "online_digital",
    title: "6. 온라인/디지털 상황",
    scenarios: [
      { id: "customer_service_chat", title: "고객센터 채팅 상담원 – 고객", description: "가입/로그인 문제, 결제 오류, 계정 정지 문의" },
      { id: "online_seller_buyer", title: "온라인 쇼핑몰 셀러 – 구매자", description: "상품 상세 문의, 배송 지연, 반품/환불" },
      { id: "game_voice_chat", title: "게임 음성 채팅: 팀장 – 팀원", description: "전략 설명, 요청·지시·칭찬/사과 표현 연습 (캐주얼하지만 실전 영어 많이 나오는 영역)" },
    ],
  },
  {
    id: "relationships_emotions",
    title: "7. 인간관계 & 감정/갈등 상황",
    scenarios: [
      { id: "close_friends", title: "‍‍ 친한 친구 1, 2", description: "고민 상담, 연애 이야기, 기쁨/슬픔 나누기" },
      { id: "apology_situation", title: "사과 상황: 잘못한 사람 – 서운한 사람", description: "사과하기, 오해 풀기, 감정 표현(“hurt”, “upset”, “disappointed” 등)" },
      { id: "roommate_conflict", title: "룸메이트 갈등: 밤늦게 시끄러운 사람 – 피해자", description: "예의 지키면서 불편함 전달, 합의점 찾기" },
      { id: "lovers_ex_lovers", title: "연인/전 연인", description: "헤어지자고 말하기, 관계 문제 이야기 (난이도 최상급, 감정 표현 폭발)" },
    ],
  },
  {
    id: "meta_situations",
    title: "8. 영어 학습 앱 특화 “메타 상황”",
    scenarios: [
      { id: "ai_english_tutor_student", title: "‍ AI 영어 튜터 – 학생", description: "오늘 배울 표현 설명 → 바로 상황극으로 써보기" },
      { id: "career_coach_job_seeker", title: "커리어 코치 – 구직자", description: "이력서 피드백, 면접 답변 연습, 자기소개 다듬기" },
      { id: "language_exchange_partner", title: "언어 교환 파트너 (한국인 ↔ 외국인)", description: "서로 문화 설명, 오해 풀기, 한국/외국 문화 비교" },
    ],
  },
];
