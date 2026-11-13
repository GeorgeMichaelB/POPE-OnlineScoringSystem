import React, { useState } from 'react';
import {
  CheckCircle,
  BookOpen,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import type { BoyQuiz, QuizQuestion, Student } from '../../types';
import { TIER_STYLES } from '../../services/badgesEngine';
import { renderBadgeIconOrImage } from '../BadgePickerModal';
import { sound } from '../../services/sound';

interface BoyQuizzesViewProps {
  student: Student;
  quizzes: BoyQuiz[];
  onCompleteQuiz: (quizId: string, scoreGained: number) => Promise<void>;
}

export const BoyQuizzesView: React.FC<BoyQuizzesViewProps> = ({
  student,
  quizzes,
  onCompleteQuiz,
}) => {
  const [activeQuiz, setActiveQuiz] = useState<BoyQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMatchingLeftId, setSelectedMatchingLeftId] = useState<string | null>(null);

  const startQuiz = (quiz: BoyQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setIsFinished(false);

    // Pre-initialize initial states for order questions (shuffled) or matching
    const initialAnswers: Record<number, any> = {};
    quiz.questions.forEach((q, idx) => {
      const type = q.type || 'mcq';
      if (type === 'order' && q.orderItems && q.orderItems.length > 0) {
        // Shuffle the items for the boy to arrange
        const shuffled = [...q.orderItems].sort(() => Math.random() - 0.5);
        initialAnswers[idx] = shuffled;
      } else if (type === 'matching') {
        initialAnswers[idx] = {};
      }
    });
    setSelectedAnswers(initialAnswers);
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSelectTrueFalse = (questionIndex: number, val: boolean) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: val,
    }));
  };

  const handleFillBlankChange = (questionIndex: number, text: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: text,
    }));
  };

  const handleMoveOrderItem = (questionIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const currentList: string[] = selectedAnswers[questionIndex] || [];
    if (!currentList.length) return;
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const updated = [...currentList];
    const temp = updated[itemIndex];
    updated[itemIndex] = updated[targetIndex];
    updated[targetIndex] = temp;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: updated,
    }));
  };

  const handleConnectMatching = (questionIndex: number, leftId: string, rightValue: string) => {
    const currentMap = selectedAnswers[questionIndex] || {};
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        ...currentMap,
        [leftId]: rightValue,
      },
    }));
    setSelectedMatchingLeftId(null);
  };

  const isQuestionAnswered = (q: QuizQuestion, idx: number): boolean => {
    const ans = selectedAnswers[idx];
    const type = q.type || 'mcq';
    if (type === 'mcq') return ans !== undefined && typeof ans === 'number';
    if (type === 'true_false') return typeof ans === 'boolean';
    if (type === 'fill_blank') return typeof ans === 'string' && ans.trim().length > 0;
    if (type === 'order') return Array.isArray(ans) && ans.length === (q.orderItems?.length || 0);
    if (type === 'matching') {
      if (!ans || typeof ans !== 'object') return false;
      const keys = Object.keys(ans);
      return keys.length === (q.matchingPairs?.length || 0);
    }
    return false;
  };

  // Grade individual question
  const isQuestionCorrect = (q: QuizQuestion, answer: any): boolean => {
    const type = q.type || 'mcq';
    if (type === 'mcq') {
      return answer === q.correctOptionIndex;
    }
    if (type === 'true_false') {
      const expected = q.correctBoolean ?? true;
      return answer === expected;
    }
    if (type === 'fill_blank') {
      if (typeof answer !== 'string') return false;
      const clean = (s: string) =>
        s
          .trim()
          .toLowerCase()
          .replace(/[إأآا]/g, 'ا')
          .replace(/ة/g, 'ه')
          .replace(/ى/g, 'ي')
          .replace(/[ًٌٍَُِّْـ]/g, '');
      const cleanUser = clean(answer);
      if (!cleanUser) return false;
      if (q.blankAnswer && clean(q.blankAnswer) === cleanUser) return true;
      if (q.acceptableAnswers?.some((a) => clean(a) === cleanUser)) return true;
      return false;
    }
    if (type === 'order') {
      if (!Array.isArray(answer) || !q.orderItems) return false;
      if (answer.length !== q.orderItems.length) return false;
      return answer.every((item, i) => item === q.orderItems![i]);
    }
    if (type === 'matching') {
      if (!answer || typeof answer !== 'object' || !q.matchingPairs) return false;
      return q.matchingPairs.every((pair) => answer[pair.id] === pair.right);
    }
    return false;
  };

  const getCorrectAnswerSummary = (q: QuizQuestion): string => {
    const type = q.type || 'mcq';
    if (type === 'mcq') {
      return q.options && q.correctOptionIndex !== undefined ? q.options[q.correctOptionIndex] : '';
    }
    if (type === 'true_false') {
      return (q.correctBoolean ?? true) ? 'صح (صواب) ✅' : 'خطأ ❌';
    }
    if (type === 'fill_blank') {
      return q.blankAnswer || q.acceptableAnswers?.[0] || '';
    }
    if (type === 'order') {
      return q.orderItems?.join(' ⬅️ ') || '';
    }
    if (type === 'matching') {
      return q.matchingPairs?.map((p) => `${p.left} ⬅️ ${p.right}`).join(' • ') || '';
    }
    return '';
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!activeQuiz) return;
    setIsFinished(true);

    // Calculate score
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (isQuestionCorrect(q, selectedAnswers[idx])) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / activeQuiz.questions.length) * 100);

    // If passed (>= 50%)
    if (percent >= 50) {
      sound.playSuccessChime();
      setIsSubmitting(true);
      try {
        await onCompleteQuiz(activeQuiz.id, activeQuiz.scoreReward);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      sound.playAlertChime();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
          }}
        >
          <BookOpen size={26} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc' }}>
            المسابقات والكويزات التفاعلية 📝
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            اختبر معلوماتك في الكتاب المقدس والطقس، واكسب نقاطاً وأوسمة ذهبية وفضية نادرة!
          </p>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {quizzes.map((quiz) => {
          const isCompleted = Array.isArray(quiz?.completedStudentIds) && quiz.completedStudentIds.includes(student.id);
          const tierStyle = TIER_STYLES[quiz.badgeTier];

          return (
            <div
              key={quiz.id}
              style={{
                background: isCompleted ? '#0f172a' : '#1e293b',
                borderRadius: '18px',
                border: isCompleted ? '1.5px solid #10b981' : `1.5px solid ${tierStyle.borderColor}40`,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isCompleted ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Optional Quiz Banner Photo */}
              {quiz.imageUrl && (
                <div
                  style={{
                    margin: '-1.25rem -1.25rem 1rem -1.25rem',
                    height: '110px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <img
                    src={quiz.imageUrl}
                    alt={quiz.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, transparent 40%, #1e293b 100%)',
                    }}
                  />
                </div>
              )}

              <div>
                {/* Header row: Badge + Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: tierStyle.bgGradient,
                      border: `1.5px solid ${tierStyle.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 10px ${tierStyle.glowColor}`,
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {renderBadgeIconOrImage(
                      { icon: quiz.badgeIcon, name: quiz.badgeName, textColor: tierStyle.textColor },
                      22,
                      tierStyle.textColor
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                      {quiz.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: tierStyle.borderColor,
                        background: `${tierStyle.borderColor}15`,
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      وسام: {quiz.badgeName} ({tierStyle.labelAr})
                    </span>
                  </div>
                </div>

                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {quiz.description}
                </p>

                {/* Info row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    marginBottom: '1.25rem',
                    background: '#0f172a',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                  }}
                >
                  <span>عدد الأسئلة: <b>{quiz.questions.length}</b></span>
                  <span style={{ color: '#fbbf24', fontWeight: 800 }}>+{quiz.scoreReward} نقطة ⭐</span>
                </div>
              </div>

              {/* Action Button */}
              {isCompleted ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                  }}
                >
                  <CheckCircle size={18} />
                  <span>تم اجتياز المسابقة وحصد الوسام 🏆</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startQuiz(quiz)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#0f172a',
                    fontWeight: 900,
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>ابدأ المسابقة الآن 🚀</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Quiz Runner Modal */}
      {activeQuiz && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: '680px',
              width: '95%',
              background: '#0f172a',
              borderRadius: '20px',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.25)',
              padding: '1.75rem',
              color: '#f8fafc',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {activeQuiz.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuiz(null)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {!isFinished ? (
              <div>
                {/* Stepper Progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <span>السؤال {currentQuestionIndex + 1} من {activeQuiz.questions.length}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>المكافأة: +{activeQuiz.scoreReward} نقطة ووسام</span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: '#1e293b',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>

                {/* Question Type Badge */}
                {(() => {
                  const q = activeQuiz.questions[currentQuestionIndex];
                  const qType = q.type || 'mcq';
                  const typeLabel =
                    qType === 'true_false'
                      ? 'صح أم خطأ'
                      : qType === 'fill_blank'
                      ? 'أكمل الفراغ / آية'
                      : qType === 'order'
                      ? 'رتّب بالترتيب الصحيح'
                      : qType === 'matching'
                      ? 'وصّل وطابق العناصر'
                      : 'اختيار من متعدد';

                  return (
                    <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                  );
                })()}

                {/* Question Image if uploaded */}
                {activeQuiz.questions[currentQuestionIndex].imageUrl && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      maxHeight: '200px',
                      border: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#090d16',
                    }}
                  >
                    <img
                      src={activeQuiz.questions[currentQuestionIndex].imageUrl}
                      alt="Question Illustration"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Question Text */}
                <div
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    lineHeight: 1.5,
                    direction: 'rtl',
                  }}
                >
                  {activeQuiz.questions[currentQuestionIndex].question}
                </div>

                {/* Dynamic Question Body by Type */}
                {(() => {
                  const q = activeQuiz.questions[currentQuestionIndex];
                  const qType = q.type || 'mcq';

                  // 1. Multiple Choice (MCQ)
                  if (qType === 'mcq') {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                        {q.options?.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                              style={{
                                background: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                                border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                                borderRadius: '12px',
                                padding: '0.85rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                direction: 'rtl',
                              }}
                            >
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  border: isSelected ? '6px solid #38bdf8' : '2px solid #64748b',
                                  background: isSelected ? '#0f172a' : 'transparent',
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontSize: '0.92rem', fontWeight: isSelected ? 700 : 500, color: '#f8fafc' }}>
                                {opt}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // 2. True / False
                  if (qType === 'true_false') {
                    const currentVal = selectedAnswers[currentQuestionIndex];

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleSelectTrueFalse(currentQuestionIndex, true)}
                          style={{
                            padding: '1.25rem',
                            borderRadius: '14px',
                            border: currentVal === true ? '2.5px solid #10b981' : '1px solid #334155',
                            background: currentVal === true ? 'rgba(16, 185, 129, 0.25)' : '#1e293b',
                            color: currentVal === true ? '#34d399' : '#f8fafc',
                            fontWeight: 900,
                            fontSize: '1.15rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: currentVal === true ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                          }}
                        >
                          <Check size={32} />
                          <span>صح (صواب) ✅</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectTrueFalse(currentQuestionIndex, false)}
                          style={{
                            padding: '1.25rem',
                            borderRadius: '14px',
                            border: currentVal === false ? '2.5px solid #ef4444' : '1px solid #334155',
                            background: currentVal === false ? 'rgba(239, 68, 68, 0.25)' : '#1e293b',
                            color: currentVal === false ? '#f87171' : '#f8fafc',
                            fontWeight: 900,
                            fontSize: '1.15rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: currentVal === false ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
                          }}
                        >
                          <X size={32} />
                          <span>خطأ ❌</span>
                        </button>
                      </div>
                    );
                  }

                  // 3. Fill in the Blank
                  if (qType === 'fill_blank') {
                    const textVal = selectedAnswers[currentQuestionIndex] || '';

                    return (
                      <div style={{ marginBottom: '1.5rem', direction: 'rtl' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 600 }}>
                          اكتب الكلمة أو الآية الناقصة:
                        </label>
                        <input
                          type="text"
                          placeholder="اكتب إجابتك هنا..."
                          value={textVal}
                          onChange={(e) => handleFillBlankChange(currentQuestionIndex, e.target.value)}
                          style={{
                            width: '100%',
                            background: '#1e293b',
                            border: '1.5px solid #38bdf8',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            color: '#ffffff',
                            fontSize: '1rem',
                            fontWeight: 700,
                            outline: 'none',
                          }}
                        />
                      </div>
                    );
                  }

                  // 4. Order Sequence
                  if (qType === 'order') {
                    const items: string[] = selectedAnswers[currentQuestionIndex] || q.orderItems || [];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', direction: 'rtl' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                          💡 استخدم الأسهم لترتيب العناصر بالترتيب الصحيح (من الأول للآخر):
                        </div>
                        {items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            style={{
                              background: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '10px',
                              padding: '0.65rem 0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span
                                style={{
                                  background: '#0284c7',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                }}
                              >
                                {itemIdx + 1}
                              </span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                                {item}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                disabled={itemIdx === 0}
                                onClick={() => handleMoveOrderItem(currentQuestionIndex, itemIdx, 'up')}
                                style={{
                                  background: itemIdx === 0 ? '#0f172a' : '#334155',
                                  color: itemIdx === 0 ? '#475569' : '#38bdf8',
                                  border: 'none',
                                  borderRadius: '6px',
                                  width: '28px',
                                  height: '28px',
                                  cursor: itemIdx === 0 ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <ArrowUp size={15} />
                              </button>
                              <button
                                type="button"
                                disabled={itemIdx === items.length - 1}
                                onClick={() => handleMoveOrderItem(currentQuestionIndex, itemIdx, 'down')}
                                style={{
                                  background: itemIdx === items.length - 1 ? '#0f172a' : '#334155',
                                  color: itemIdx === items.length - 1 ? '#475569' : '#38bdf8',
                                  border: 'none',
                                  borderRadius: '6px',
                                  width: '28px',
                                  height: '28px',
                                  cursor: itemIdx === items.length - 1 ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <ArrowDown size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // 5. Matching / Pairs
                  if (qType === 'matching') {
                    const pairs = q.matchingPairs || [];
                    const matches: Record<string, string> = selectedAnswers[currentQuestionIndex] || {};
                    // Get all right options in fixed order
                    const rightOptions = Array.from(new Set(pairs.map((p) => p.right)));

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', direction: 'rtl' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          💡 اضغط على العنصر في العمود الأيمن ثم اختر ما يطابقه من الخيارات:
                        </div>

                        {pairs.map((pair) => {
                          const currentMatch = matches[pair.id];
                          const isSelecting = selectedMatchingLeftId === pair.id;

                          return (
                            <div
                              key={pair.id}
                              style={{
                                background: '#1e293b',
                                border: isSelecting ? '2px solid #fbbf24' : currentMatch ? '1px solid #10b981' : '1px solid #334155',
                                borderRadius: '12px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                              }}
                            >
                              <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.92rem' }}>
                                {pair.left}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {currentMatch ? (
                                  <span
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.2)',
                                      border: '1px solid #10b981',
                                      color: '#34d399',
                                      padding: '4px 10px',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    ➡️ {currentMatch}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>لم يتم التوصيل بعد</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedMatchingLeftId(isSelecting ? null : pair.id)}
                                  style={{
                                    background: isSelecting ? '#fbbf24' : '#0284c7',
                                    color: isSelecting ? '#0f172a' : '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isSelecting ? 'إلغاء' : currentMatch ? 'تغيير' : 'توصيل'}
                                </button>
                              </div>

                              {isSelecting && (
                                <div style={{ width: '100%', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #334155', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                  <span style={{ width: '100%', fontSize: '0.72rem', color: '#fbbf24' }}>اختر المطابق لـ "{pair.left}":</span>
                                  {rightOptions.map((opt, optIdx) => (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => handleConnectMatching(currentQuestionIndex, pair.id, opt)}
                                      style={{
                                        background: '#0f172a',
                                        border: '1px solid #38bdf8',
                                        color: '#f8fafc',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    style={{
                      background: '#1e293b',
                      color: currentQuestionIndex === 0 ? '#475569' : '#f8fafc',
                      border: '1px solid #334155',
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    السابق
                  </button>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={!isQuestionAnswered(activeQuiz.questions[currentQuestionIndex], currentQuestionIndex) || isSubmitting}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      color: '#0f172a',
                      fontWeight: 900,
                      padding: '0.6rem 1.5rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      cursor: !isQuestionAnswered(activeQuiz.questions[currentQuestionIndex], currentQuestionIndex) || isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: !isQuestionAnswered(activeQuiz.questions[currentQuestionIndex], currentQuestionIndex) || isSubmitting ? 0.6 : 1,
                    }}
                  >
                    {currentQuestionIndex < activeQuiz.questions.length - 1
                      ? 'السؤال التالي'
                      : isSubmitting
                      ? 'جاري الحفظ...'
                      : 'إنهاء المسابقة 🏁'}
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Results Screen */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                {(() => {
                  let correctCount = 0;
                  activeQuiz.questions.forEach((q, idx) => {
                    if (isQuestionCorrect(q, selectedAnswers[idx])) correctCount++;
                  });
                  const percent = Math.round((correctCount / activeQuiz.questions.length) * 100);
                  const isPassed = percent >= 50;

                  return (
                    <>
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          background: isPassed ? '#10b981' : '#f59e0b',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1rem',
                          boxShadow: isPassed ? '0 0 25px #10b981' : 'none',
                        }}
                      >
                        {isPassed ? <CheckCircle size={40} /> : <RotateCcw size={36} />}
                      </div>

                      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.45rem', fontWeight: 900, color: isPassed ? '#34d399' : '#fbbf24' }}>
                        {isPassed ? 'أحسنت يا بطل! تم اجتياز المسابقة بنجاح 🏆' : 'حاول مرة أخرى لتحصل على الوسام!'}
                      </h3>

                      <p style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                        أجبت بشكل صحيح على {correctCount} من أصل {activeQuiz.questions.length} أسئلة ({percent}%)
                      </p>

                      {isPassed && (
                        <div
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid #10b981',
                            borderRadius: '14px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                          }}
                        >
                          <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 800 }}>
                            🎉 تمت إضافة +{activeQuiz.scoreReward} نقطة إلى رصيدك وتم منحك وسام "{activeQuiz.badgeName}"!
                          </span>
                        </div>
                      )}

                      {/* Review Explanations */}
                      <div style={{ maxHeight: '240px', overflowY: 'auto', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', direction: 'rtl' }}>
                        {activeQuiz.questions.map((q, idx) => {
                          const isCorrect = isQuestionCorrect(q, selectedAnswers[idx]);
                          const correctSummary = getCorrectAnswerSummary(q);

                          return (
                            <div key={idx} style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '10px', border: isCorrect ? '1px solid #10b981' : '1px solid #ef4444' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc', marginBottom: '0.25rem' }}>
                                {idx + 1}. {q.question}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: isCorrect ? '#34d399' : '#f87171', fontWeight: 600 }}>
                                {isCorrect ? '✅ إجابة صحيحة' : '❌ الإجابة الصحيحة: ' + correctSummary}
                              </div>
                              {q.explanation && (
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                  💡 {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveQuiz(null)}
                        style={{
                          background: '#38bdf8',
                          color: '#0f172a',
                          fontWeight: 900,
                          border: 'none',
                          padding: '0.65rem 2rem',
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        إغلاق المسابقة
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
