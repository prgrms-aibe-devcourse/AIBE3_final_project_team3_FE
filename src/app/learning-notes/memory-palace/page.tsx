"use client";

import { useEffect, useState } from "react";

interface VocabularyItem {
  id: number;
  korean: string;
  english: string;
  mastered: boolean;
}

interface Card {
  id: string;
  content: string;
  type: "korean" | "english";
  vocabularyId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameStats {
  moves: number;
  matches: number;
  timeElapsed: number;
  accuracy: number;
}

export default function MemoryPalaceGame() {
  // Mock vocabulary data
  const mockVocabulary: VocabularyItem[] = [
    { id: 1, korean: "도서관", english: "library", mastered: false },
    { id: 2, korean: "감사합니다", english: "thank you", mastered: true },
    { id: 3, korean: "학교", english: "school", mastered: false },
    { id: 4, korean: "음식", english: "food", mastered: true },
    { id: 5, korean: "친구", english: "friend", mastered: false },
    { id: 6, korean: "집", english: "house", mastered: true },
    { id: 7, korean: "물", english: "water", mastered: false },
    { id: 8, korean: "책", english: "book", mastered: true },
  ];

  const [gameMode, setGameMode] = useState<"learning" | "mastered" | null>(
    null
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );
  const [gameActive, setGameActive] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<GameStats>({
    moves: 0,
    matches: 0,
    timeElapsed: 0,
    accuracy: 0,
  });
  const [gameResult, setGameResult] = useState<GameStats | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [showingCards, setShowingCards] = useState(false);

  // Get vocabulary based on mode
  const getVocabularyForMode = () => {
    if (gameMode === "learning") {
      return mockVocabulary.filter((item) => !item.mastered);
    } else if (gameMode === "mastered") {
      return mockVocabulary.filter((item) => item.mastered);
    }
    return [];
  };

  // Get number of pairs based on difficulty
  const getPairsCount = (diff: "easy" | "medium" | "hard") => {
    switch (diff) {
      case "easy":
        return 4;
      case "medium":
        return 6;
      case "hard":
        return 8;
      default:
        return 4;
    }
  };

  // Create cards for the game
  const createCards = (
    vocabulary: VocabularyItem[],
    pairCount: number
  ): Card[] => {
    const selectedVocab = vocabulary.slice(0, pairCount);
    const cards: Card[] = [];

    selectedVocab.forEach((vocab) => {
      // Korean card
      cards.push({
        id: `korean-${vocab.id}`,
        content: vocab.korean,
        type: "korean",
        vocabularyId: vocab.id,
        isFlipped: false,
        isMatched: false,
      });

      // English card
      cards.push({
        id: `english-${vocab.id}`,
        content: vocab.english,
        type: "english",
        vocabularyId: vocab.id,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    return cards.sort(() => Math.random() - 0.5);
  };

  // Start game
  const startGame = (
    mode: "learning" | "mastered",
    diff: "easy" | "medium" | "hard"
  ) => {
    const vocabulary =
      mode === "learning"
        ? mockVocabulary.filter((item) => !item.mastered)
        : mockVocabulary.filter((item) => item.mastered);

    if (vocabulary.length === 0) return;

    const pairCount = Math.min(getPairsCount(diff), vocabulary.length);
    if (pairCount < 2) return;

    setGameMode(mode);
    setDifficulty(diff);
    setGameActive(false); // Initially disabled during preview
    setShowingCards(true);
    const gameCards = createCards(vocabulary, pairCount);
    // Show all cards initially
    const cardsWithFlipped = gameCards.map((card) => ({
      ...card,
      isFlipped: true,
    }));
    setCards(cardsWithFlipped);
    setFlippedCards([]);
    setStats({ moves: 0, matches: 0, timeElapsed: 0, accuracy: 0 });
    setGameResult(null);

    // After 3 seconds, flip all cards back and start the game
    setTimeout(() => {
      setCards((prev) => prev.map((card) => ({ ...card, isFlipped: false })));
      setShowingCards(false);
      setGameActive(true);
      setStartTime(Date.now());
    }, 3000);
  };

  // Handle card click
  const handleCardClick = (clickedCard: Card) => {
    if (
      !gameActive ||
      showingCards ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      flippedCards.length >= 2
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);

    // Flip the card
    setCards((prev) =>
      prev.map((card) =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      setStats((prev) => ({ ...prev, moves: prev.moves + 1 }));

      const [card1, card2] = newFlippedCards;
      const isMatch =
        card1.vocabularyId === card2.vocabularyId && card1.type !== card2.type;

      setTimeout(() => {
        if (isMatch) {
          // Match found
          setCards((prev) =>
            prev.map((card) =>
              card.vocabularyId === card1.vocabularyId
                ? { ...card, isMatched: true }
                : card
            )
          );
          setStats((prev) => ({ ...prev, matches: prev.matches + 1 }));
        } else {
          // No match, flip cards back
          setCards((prev) =>
            prev.map((card) =>
              card.id === card1.id || card.id === card2.id
                ? { ...card, isFlipped: false }
                : card
            )
          );
        }
        setFlippedCards([]);
      }, 1000);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!gameActive || !startTime) return;

    const timer = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, startTime]);

  // Check for game completion
  useEffect(() => {
    if (
      gameActive &&
      cards.length > 0 &&
      cards.every((card) => card.isMatched)
    ) {
      const totalPairs = cards.length / 2;
      const accuracy = Math.round((totalPairs / stats.moves) * 100);
      const finalStats = { ...stats, accuracy };

      setGameResult(finalStats);
      setGameActive(false);
    }
  }, [cards, stats, gameActive]);

  // Game result screen
  if (gameResult) {
    const getGrade = () => {
      if (gameResult.accuracy >= 90)
        return { grade: "S", color: "text-yellow-400", emoji: "🏆" };
      if (gameResult.accuracy >= 80)
        return { grade: "A", color: "text-emerald-400", emoji: "⭐" };
      if (gameResult.accuracy >= 70)
        return { grade: "B", color: "text-blue-400", emoji: "👏" };
      if (gameResult.accuracy >= 60)
        return { grade: "C", color: "text-purple-400", emoji: "👍" };
      return { grade: "D", color: "text-gray-400", emoji: "💪" };
    };

    const { grade, color, emoji } = getGrade();

    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8 border border-gray-600">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-3xl font-bold mb-2 text-white">게임 완료!</h1>
          <div className={`text-4xl font-bold ${color} mb-6`}>
            Grade: {grade}
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-400">
                {gameResult.matches}
              </div>
              <div className="text-gray-300">매치 성공</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xl font-bold text-blue-400">
                  {gameResult.moves}
                </div>
                <div className="text-sm text-gray-300">총 시도</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xl font-bold text-amber-400">
                  {gameResult.timeElapsed}초
                </div>
                <div className="text-sm text-gray-300">소요 시간</div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">
                {gameResult.accuracy}%
              </div>
              <div className="text-gray-300">정확도</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame(gameMode!, difficulty)}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              다시 플레이
            </button>
            <button
              onClick={() => {
                setGameMode(null);
                setGameResult(null);
              }}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              메뉴로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main menu
  if (!gameMode) {
    const learningWords = mockVocabulary.filter((item) => !item.mastered);
    const masteredWords = mockVocabulary.filter((item) => item.mastered);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-white">
            � Memory Palace
          </h1>
          <p className="text-gray-300 text-lg">
            카드를 뒤집어 한영 단어 쌍을 찾아보세요!
          </p>
        </div>

        {/* Game Mode Selection */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-amber-400 mb-2">
                학습 모드
              </h2>
              <p className="text-gray-300 mb-4">
                학습 중인 단어들로 기억력 게임을 해보세요
              </p>
              <div className="text-sm text-gray-400 mb-6">
                사용 가능한 단어: {learningWords.length}개
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">
                복습 모드
              </h2>
              <p className="text-gray-300 mb-4">숙달된 단어들로 복습해보세요</p>
              <div className="text-sm text-gray-400 mb-6">
                사용 가능한 단어: {masteredWords.length}개
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 border border-gray-600 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            난이도 선택
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setDifficulty("easy")}
              className={`p-4 rounded-lg border-2 transition-all ${
                difficulty === "easy"
                  ? "border-green-400 bg-green-400/20 text-white"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-green-400"
              }`}
            >
              <div className="text-2xl mb-2">😊</div>
              <div className="font-semibold">쉬움</div>
              <div className="text-sm">4쌍 (8장)</div>
            </button>
            <button
              onClick={() => setDifficulty("medium")}
              className={`p-4 rounded-lg border-2 transition-all ${
                difficulty === "medium"
                  ? "border-amber-400 bg-amber-400/20 text-white"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-amber-400"
              }`}
            >
              <div className="text-2xl mb-2">🤔</div>
              <div className="font-semibold">보통</div>
              <div className="text-sm">6쌍 (12장)</div>
            </button>
            <button
              onClick={() => setDifficulty("hard")}
              className={`p-4 rounded-lg border-2 transition-all ${
                difficulty === "hard"
                  ? "border-red-400 bg-red-400/20 text-white"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-red-400"
              }`}
            >
              <div className="text-2xl mb-2">😤</div>
              <div className="font-semibold">어려움</div>
              <div className="text-sm">8쌍 (16장)</div>
            </button>
          </div>
        </div>

        {/* Start Game Buttons */}
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => startGame("learning", difficulty)}
            disabled={learningWords.length === 0}
            className="w-full bg-amber-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {learningWords.length === 0
              ? "학습 중인 단어가 없습니다"
              : "학습 모드 시작"}
          </button>
          <button
            onClick={() => startGame("mastered", difficulty)}
            disabled={masteredWords.length === 0}
            className="w-full bg-emerald-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {masteredWords.length === 0
              ? "숙달된 단어가 없습니다"
              : "복습 모드 시작"}
          </button>
        </div>

        {/* Game Rules */}
        <div className="max-w-2xl mx-auto mt-12 bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h3 className="text-xl font-bold text-white mb-4">🎯 게임 규칙</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• 카드를 클릭해서 뒤집어보세요</li>
            <li>• 한국어와 영어가 매치되는 카드 쌍을 찾으세요</li>
            <li>• 모든 쌍을 찾으면 게임이 완료됩니다</li>
            <li>• 적은 시도 횟수로 완성할수록 높은 점수를 받습니다</li>
            <li>• 시간도 측정되니 빠르게 도전해보세요!</li>
          </ul>
        </div>
      </div>
    );
  }

  // Game screen
  const gridCols =
    cards.length <= 8
      ? "grid-cols-4"
      : cards.length <= 12
      ? "grid-cols-4"
      : "grid-cols-4";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Game Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-6 text-white">
          {showingCards ? (
            <div className="text-xl font-bold text-emerald-400">
              📖 카드를 기억하세요! 곧 게임이 시작됩니다...
            </div>
          ) : (
            <>
              <div>
                이동:{" "}
                <span className="text-emerald-400 font-bold">
                  {stats.moves}
                </span>
              </div>
              <div>
                매치:{" "}
                <span className="text-amber-400 font-bold">
                  {stats.matches}/{cards.length / 2}
                </span>
              </div>
              <div>
                시간:{" "}
                <span className="text-blue-400 font-bold">
                  {stats.timeElapsed}초
                </span>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => {
            setGameActive(false);
            setShowingCards(false);
            setGameMode(null);
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          게임 종료
        </button>
      </div>

      {/* Game Board */}
      <div className={`grid ${gridCols} gap-4 max-w-4xl mx-auto`}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card)}
            className={`
              relative h-24 transition-all duration-300 transform
              ${card.isMatched ? "opacity-50" : ""}
              ${
                !gameActive || showingCards
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:scale-105"
              }
            `}
          >
            <div
              className={`
              absolute inset-0 rounded-lg border-2 transition-all duration-500 transform
              ${card.isFlipped || card.isMatched ? "rotate-y-180" : ""}
              ${
                card.isMatched
                  ? "border-green-400 bg-green-400/20"
                  : "border-gray-600"
              }
            `}
            >
              {/* Card Back */}
              <div
                className={`
                absolute inset-0 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 
                flex items-center justify-center backface-hidden
                ${
                  card.isFlipped || card.isMatched ? "opacity-0" : "opacity-100"
                }
              `}
              >
                <div className="w-8 h-8 bg-white/20 rounded-full"></div>
              </div>

              {/* Card Front */}
              <div
                className={`
                absolute inset-0 rounded-lg bg-gray-800 border-2
                flex items-center justify-center backface-hidden rotate-y-180 p-2
                ${
                  card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0"
                }
                ${
                  card.type === "korean"
                    ? "border-amber-400"
                    : "border-emerald-400"
                }
              `}
              >
                <div
                  className={`
                  text-center font-semibold
                  ${
                    card.type === "korean"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                  ${card.content.length > 6 ? "text-sm" : "text-base"}
                `}
                >
                  {card.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-8 max-w-md mx-auto">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">진행률</span>
            <span className="text-white font-bold">
              {Math.round((stats.matches / (cards.length / 2)) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(stats.matches / (cards.length / 2)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
