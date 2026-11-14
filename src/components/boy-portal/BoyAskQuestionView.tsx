import React, { useState } from 'react';
import {
  HelpCircle,
  Send,
  MessageCircle,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { BoyQuestion, Student } from '../../types';
import { sound } from '../../services/sound';

interface BoyAskQuestionViewProps {
  student: Student;
  questions: BoyQuestion[];
  onSubmitQuestion: (question: {
    questionText: string;
    category: BoyQuestion['category'];
    isAnonymous: boolean;
  }) => Promise<void>;
}

export const BoyAskQuestionView: React.FC<BoyAskQuestionViewProps> = ({
  student,
  questions,
  onSubmitQuestion,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState<BoyQuestion['category']>('spiritual');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Filter questions by this student
  const myQuestions = questions.filter((q) => q.studentId === student.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitQuestion({
        questionText: questionText.trim(),
        category,
        isAnonymous,
      });
      sound.playSuccessChime();
      setQuestionText('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: BoyQuestion['category']) => {
    switch (cat) {
      case 'spiritual':
        return 'سؤال روحي وصلاة';
      case 'bible':
        return 'الكتاب المقدس والإنجيل';
      case 'confession':
        return 'الاعتراف ومحاسبة النفس';
      case 'personal':
        return 'استشارة وموضوع خاص';
      default:
        return 'سؤال عام عن الفصل';
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
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
          }}
        >
          <HelpCircle size={26} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>
            اسأل الخادم • فكرة وسؤال في سرية تامة
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            أي سؤال في الإنجيل أو العقيدة أو موضوع محيرك أو نصيحة خاصة.. اسأل خدامك بأمان تام! 💬
          </p>
        </div>
      </div>

      {/* Ask Question Form */}
      <div
        style={{
          background: '#1e293b',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid #334155',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
          اكتب سؤال للمستر وهو هيرد عليك         </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Category Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.4rem' }}>
              تصنيف السؤال:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {(['spiritual', 'bible', 'personal', 'confession', 'general'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    background: category === cat ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                    border: category === cat ? '1px solid #38bdf8' : '1px solid #334155',
                    color: category === cat ? '#38bdf8' : '#94a3b8',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text Area */}
          <div>
            <textarea
              rows={4}
              placeholder="اكتب سؤالك أو فكرتك بالتفصيل هنا..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              style={{
                width: '100%',
                background: '#090d16',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '0.85rem',
                color: '#f8fafc',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Privacy & Anonymous Options */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.82rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <EyeOff size={15} color="#a855f7" />
                إرسال السؤال بدون ذكر اسمي (سري تماماً)
              </span>
            </label>

            <button
              type="submit"
              disabled={!questionText.trim() || isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: questionText.trim() ? 'pointer' : 'not-allowed',
                opacity: questionText.trim() ? 1 : 0.6,
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
              }}
            >
              <Send size={16} />
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال السؤال للخدام'}
            </button>
          </div>

          {submittedSuccess && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: '10px',
                padding: '0.65rem 1rem',
                color: '#34d399',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={18} />
              <span>تم إرسال سؤالك للخدام بنجاح! سيتم الرد عليك قريباً.</span>
            </div>
          )}
        </form>
      </div>

      {/* My Questions History */}
      <div>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
          أسئلتي السابقة وإجابات الخدام ({myQuestions.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {myQuestions.map((q) => {
            const isAnswered = Boolean(q.answerText);

            return (
              <div
                key={q.id}
                style={{
                  background: '#1e293b',
                  border: isAnswered ? '1px solid #10b981' : '1px solid #334155',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        background: isAnswered ? '#10b981' : '#f59e0b',
                        color: '#0f172a',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                      }}
                    >
                      {isAnswered ? 'تمت الإجابة ✅' : 'قيد المراجعة ⏳'}
                    </span>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      {getCategoryLabel(q.category)}
                    </span>
                    {q.isAnonymous && (
                      <span style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 600 }}>
                        (مرسل بدون اسم)
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(q.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600, lineHeight: 1.5 }}>
                  "{q.questionText}"
                </p>

                {/* Servant Answer */}
                {isAnswered ? (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem', color: '#34d399', fontSize: '0.78rem', fontWeight: 800 }}>
                      <Sparkles size={14} />
                      إجابة الخادم ({q.answeredBy || 'خادم الفصل'}):
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {q.answerText}
                    </p>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    الخدام يقومون بقراءة سؤالك وسيقومون بكتابة الرد قريباً جداً.
                  </div>
                )}
              </div>
            );
          })}

          {myQuestions.length === 0 && (
            <div
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: '#1e293b',
                borderRadius: '16px',
                border: '1px solid #334155',
                color: '#94a3b8',
              }}
            >
              <MessageCircle size={36} color="#475569" style={{ marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>لم ترسل أسئلة بعد</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>أي موضوع محيرك أو سؤال في الإنجيل.. اكتبه وسيجيبك الخدام!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
