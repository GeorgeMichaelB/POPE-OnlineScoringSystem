import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  SwitchCamera,
  Image,
  Trophy,
  ArrowRight,
  AlertCircle,
  Users,
  CheckCircle,
  Zap,
} from 'lucide-react';
import type { Student } from '../types';
import { sound } from '../services/sound';
import './boy-portal/clashRoyale.css';

interface BoyLoginViewProps {
  students: Student[];
  onBoyLoginSuccess: (student: Student) => void;
  onSwitchToServantLogin: () => void;
  onLaunchHeroesScreen?: () => void;
}

export const BoyLoginView: React.FC<BoyLoginViewProps> = ({
  students,
  onBoyLoginSuccess,
  onSwitchToServantLogin,
  onLaunchHeroesScreen,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera on Mount
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraActive, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('الكاميرا غير مدعومة في هذا المتصفح. يمكنك رفع صورة الكود أو كتابة كود الباسبور.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر فتح كاميرا الجهاز.';
      setCameraError(message);
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const tick = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas && !isProcessing) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleRecognizedCode(code.data);
          return;
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tick);
  };

  const handleRecognizedCode = (rawCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const clean = rawCode.trim().toLowerCase();

    // Look for matching student by ID or Series
    const student = students.find((s) => {
      const sId = s.id.toLowerCase();
      const sSeries = (s.series || '').toLowerCase();
      return clean === sId || clean === sSeries || clean.includes(sId) || (sSeries && clean.includes(sSeries));
    });

    if (student) {
      sound.playSuccessChime();
      setScannedStudent(student);
      stopCamera();

      // Quick delay for celebration animation then login
      setTimeout(() => {
        onBoyLoginSuccess(student);
      }, 1200);
    } else {
      sound.playAlertChime();
      setLoginError(`لم يتم العثور على مخدوم مسجل بهذا الكود: "${rawCode.slice(0, 20)}". يرجى المحاولة مرة أخرى أو مراجعة الخدام.`);
      setTimeout(() => {
        setIsProcessing(false);
        if (cameraActive) {
          animFrameIdRef.current = requestAnimationFrame(tick);
        }
      }, 2500);
    }
  };

  // Image Upload File Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleRecognizedCode(code.data);
        } else {
          sound.playAlertChime();
          setLoginError('لم نتمكن من قراءة رمز الاستجابة السريعة (QR) من الصورة المرفوعة. تأكد من وضوح الصورة.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleRecognizedCode(manualCode);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Cyber Glowing Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          right: '10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Container */}
      <div
        className="cr-wood-frame"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top Gamer Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, #fde047 0%, #eab308 50%, #ca8a04 100%)',
              border: '2px solid #ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(250, 204, 21, 0.5)',
              marginBottom: '0.85rem',
            }}
          >
            <QrCode size={34} color="#713f12" strokeWidth={2.4} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(250, 204, 21, 0.15)',
              border: '1.5px solid #facc15',
              padding: '3px 12px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 900,
              color: '#fde047',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            <Zap size={13} />
            الساحة الملوكية • BOYS ARENA PASS
          </div>

          <h1
            className="cr-gold-title cr-text-shadow-heavy"
            style={{
              margin: '0.2rem 0',
              fontSize: '1.8rem',
            }}
          >
            دخول ساحة أبطال البابا ساويرس ⚔️
          </h1>

          <p style={{ margin: 0, fontSize: '0.85rem', color: '#fef3c7', fontWeight: 600 }}>
            وجّه كاميرا موبايلك على باركود باسبورك الكنسي للدخول فوراً 👑
          </p>
        </div>

        {/* Success Modal / Recognition Overlay */}
        {scannedStudent ? (
          <div
            style={{
              width: '100%',
              padding: '2.5rem 1rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '2px solid #10b981',
              borderRadius: '18px',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 0 20px #10b981',
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>
              أهلاً بك يا بطل! 🚀
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              {scannedStudent.arabicName || scannedStudent.name}
            </p>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              كود الباسبور: {scannedStudent.id}
            </span>
          </div>
        ) : (
          <>
            {/* Live Camera Scanner Viewport */}
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                aspectRatio: '1',
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative',
                background: '#020617',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              {cameraActive && !cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Gamer Crosshairs & Target Guide */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '15%',
                      left: '15%',
                      right: '15%',
                      bottom: '15%',
                      border: '2px dashed rgba(56, 189, 248, 0.7)',
                      borderRadius: '16px',
                      pointerEvents: 'none',
                      boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.55)',
                    }}
                  >
                    {/* Animated Cyber Scan Laser Line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #38bdf8, #f59e0b, transparent)',
                        boxShadow: '0 0 12px #38bdf8',
                        animation: 'scanLaser 2.2s ease-in-out infinite alternate',
                        top: '50%',
                      }}
                    />
                  </div>

                  {/* Camera Controls Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      right: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                      style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                      }}
                    >
                      <SwitchCamera size={14} />
                      قلب الكاميرا
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                      }}
                    >
                      <Image size={14} />
                      رفع صورة
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                  <Camera size={36} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{cameraError || 'الكاميرا متوقفة مؤقتاً'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraActive(true);
                      startCamera();
                    }}
                    style={{
                      marginTop: '0.75rem',
                      background: '#38bdf8',
                      color: '#0f172a',
                      padding: '5px 14px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    إعادة تشغيل الكاميرا
                  </button>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            {/* Error Message */}
            {loginError && (
              <div
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.8rem',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{loginError}</span>
              </div>
            )}

            {/* Manual Code Input Option */}
            <form onSubmit={handleManualSubmit} style={{ width: '100%', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="أو اكتب كود الباسبور (مثال: AWI1012)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="cr-btn cr-btn-yellow"
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.9rem',
                    opacity: manualCode.trim() ? 1 : 0.6,
                    cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  انطلق للدخول ⚔️
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </>
        )}

        {/* Footer Navigation Switchers */}
        <div
          style={{
            width: '100%',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            alignItems: 'center',
          }}
        >
          {/* Hall of Champions Shortcut */}
          {onLaunchHeroesScreen && (
            <button
              type="button"
              onClick={onLaunchHeroesScreen}
              className="cr-btn cr-btn-blue"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                fontSize: '0.85rem',
              }}
            >
              <Trophy size={16} color="#fbbf24" />
              <span>مشاهدة لوحة الشرف وأبطال الساحة مباشرة 🏆</span>
            </button>
          )}

          {/* Switch to Servant Login */}
          <button
            type="button"
            onClick={onSwitchToServantLogin}
            style={{
              color: '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            <Users size={14} />
            <span>هل أنت خادم؟ الدخول إلى بوابة الخدام (Servant Login)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
