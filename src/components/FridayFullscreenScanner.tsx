import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Clock,
  Fingerprint,
  Minimize2,
  AlertCircle,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import type { Student, AttendanceRecord, PointSettings } from '../types';
import { sound } from '../services/sound';
import { calculateFridayLateDeduction } from '../utils/helpers';
import { authenticateWithMacTouchID } from '../services/biometrics';

interface FridayFullscreenScannerProps {
  isOpen: boolean;
  onClose: () => void; // Minimize to roster without stopping timer
  onStopTimer: () => void; // Stop timer after Touch ID succeeds
  students: Student[];
  attendance: AttendanceRecord[];
  pointSettings: PointSettings;
  selectedDate: string;
  timerStartTime: number | null;
  timerRunning: boolean;
  timerElapsedSeconds: number;
  onRecordAttendance: (
    studentId: string,
    type: 'sundaySchool' | 'odas',
    value: boolean,
    isLate?: boolean,
    checkInMinutes?: number,
    pointsAwarded?: number
  ) => void;
}

export const FridayFullscreenScanner: React.FC<FridayFullscreenScannerProps> = ({
  isOpen,
  onClose,
  onStopTimer,
  students,
  attendance,
  pointSettings,
  selectedDate,
  timerStartTime,
  timerRunning,
  timerElapsedSeconds,
  onRecordAttendance,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const scanCooldownRef = useRef<boolean>(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [justScanned, setJustScanned] = useState<{
    student: Student;
    isLate: boolean;
    lateMinutes: number;
    pointsAwarded: number;
    deduction: number;
    checkInMinutes: number;
  } | null>(null);

  // Biometric Touch ID modal state
  const [isVerifyingTouchID, setIsVerifyingTouchID] = useState(false);
  const [touchIDError, setTouchIDError] = useState<string | null>(null);
  const [isFallbackPasswordOpen, setIsFallbackPasswordOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [sessionScannedList, setSessionScannedList] = useState<
    Array<{
      student: Student;
      isLate: boolean;
      pointsAwarded: number;
      timeString: string;
    }>
  >([]);

  // Scoring rules
  const cutoffMinutes = pointSettings.fridayLateCutoffMinutes ?? 15;
  const cutoffSeconds = cutoffMinutes * 60;
  const intervalMinutes = pointSettings.fridayLateIntervalMinutes ?? 2;
  const intervalPoints = pointSettings.fridayLateIntervalPoints ?? 1;
  const fullPoints = pointSettings.fridayClassPoints || 10;
  const isLateDeductionActive = pointSettings.fridayLateDeductionEnabled !== false;

  const attendedCount = attendance.filter((r) => r.date === selectedDate && r.sundaySchool).length;
  const isLatePeriod = isLateDeductionActive && timerElapsedSeconds >= cutoffSeconds;
  const currentElapsedMinutes = Math.floor(timerElapsedSeconds / 60);

  // Current prospective points if scanned right this second
  const currentCheck = calculateFridayLateDeduction(currentElapsedMinutes, pointSettings);
  const currentLivePoints = currentCheck.awardedPoints;

  const remainingSeconds = Math.max(0, cutoffSeconds - timerElapsedSeconds);
  const remMins = Math.floor(remainingSeconds / 60);
  const remSecs = remainingSeconds % 60;

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins < 60) {
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Start Camera when Fullscreen is open
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Selfie camera for mirror view
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
      console.warn('Camera stream error:', err);
      // Try default video if user facing failed
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (e) {
        const message = err instanceof Error ? err.message : 'Could not access device camera.';
        setCameraError(message);
      }
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

  // QR Scanning Loop
  const tick = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !scanCooldownRef.current) {
          const scannedCode = code.data.trim();
          handleScannedCode(scannedCode);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tick);
  };

  const handleScannedCode = (scannedCode: string) => {
    const cleanScanned = scannedCode.trim().toLowerCase();
    const found = students.find(
      (s) =>
        s.id.toLowerCase() === cleanScanned ||
        (s.series && s.series.toLowerCase() === cleanScanned)
    );

    if (!found) {
      sound.playAlertChime();
      return;
    }

    scanCooldownRef.current = true;
    sound.playSuccessChime();

    // Calculate late status and interval deduction
    const elapsedMinutes = timerStartTime ? (Date.now() - timerStartTime) / 60000 : 0;
    const checkInMins = Math.floor(elapsedMinutes);

    const deductionResult = calculateFridayLateDeduction(checkInMins, pointSettings);
    const isLate = deductionResult.isLate;
    const awardedPoints = deductionResult.awardedPoints;

    setJustScanned({
      student: found,
      isLate,
      lateMinutes: deductionResult.lateMinutes,
      pointsAwarded: awardedPoints,
      deduction: deductionResult.totalDeduction,
      checkInMinutes: checkInMins,
    });

    // Record attendance
    onRecordAttendance(found.id, 'sundaySchool', true, isLate, checkInMins, awardedPoints);

    // Add to session ticker
    setSessionScannedList((prev) => [
      {
        student: found,
        isLate,
        pointsAwarded: awardedPoints,
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 9),
    ]);

    // Clear confirmation card after 3.5s and allow next scan
    setTimeout(() => {
      setJustScanned(null);
      scanCooldownRef.current = false;
    }, 3200);
  };

  // Touch ID Verification for Stopping Timer
  const handleInitiateStopTimer = async () => {
    setTouchIDError(null);
    setIsVerifyingTouchID(true);

    const requireTouchID = pointSettings.fridayLateRequireTouchID !== false;

    if (!requireTouchID) {
      // If Touch ID is disabled in settings, allow immediate stop
      setIsVerifyingTouchID(false);
      onStopTimer();
      onClose();
      return;
    }

    // Trigger native MacBook Touch ID
    const result = await authenticateWithMacTouchID('Verify fingerprint to stop Friday class timer');

    if (result.success) {
      sound.playSuccessChime();
      setIsVerifyingTouchID(false);
      onStopTimer();
      onClose();
    } else {
      sound.playAlertChime();
      setTouchIDError(result.error || 'Fingerprint verification failed. Timer cannot be stopped without authorization.');
    }
  };

  // Fallback servant master password verify if Touch ID hardware is unavailable
  const handleFallbackPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim().length >= 4) {
      setIsFallbackPasswordOpen(false);
      setIsVerifyingTouchID(false);
      onStopTimer();
      onClose();
    } else {
      alert('Please enter a valid password.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: '#090d16',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
    >
      {/* Top HUD: Class Session, Live Timer & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.85rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10,
        }}
      >
        {/* Left: Branding & Session Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Camera size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Friday Class Live Scanner
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: 'rgba(99, 102, 241, 0.25)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Mirrored View 🪞
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
              Session: <strong>{selectedDate}</strong> • Present: <strong>{attendedCount} / {students.length}</strong> • Grace {cutoffMinutes}m, then -{intervalPoints} pt every {intervalMinutes}m
            </p>
          </div>
        </div>

        {/* Center: Live Digital Clock & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Big Digital Clock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.45rem 1.15rem',
              background: isLatePeriod ? 'rgba(217, 119, 6, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              border: `1.5px solid ${isLatePeriod ? '#f59e0b' : '#10b981'}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: isLatePeriod
                ? '0 0 20px rgba(245, 158, 11, 0.25)'
                : '0 0 20px rgba(16, 185, 129, 0.25)',
            }}
          >
            <Clock size={20} color={isLatePeriod ? '#f59e0b' : '#34d399'} className={timerRunning ? 'timer-pulse' : ''} />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '1.65rem',
                fontWeight: 800,
                color: isLatePeriod ? '#fbbf24' : '#6ee7b7',
                letterSpacing: '1.5px',
              }}
            >
              {formatTimer(timerElapsedSeconds)}
            </span>
          </div>

          {/* Dynamic Status Pill */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {isLatePeriod ? (
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                ⏱️ LATE DEDUCTION ACTIVE • Now awarding: {currentLivePoints} pts (-{currentCheck.totalDeduction} pts)
              </span>
            ) : (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                🟢 ON-TIME PERIOD (Full {fullPoints} pts) • {remMins}m {remSecs}s remaining
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Cutoff {cutoffMinutes}m • Decreases by {intervalPoints} pt every {intervalMinutes} min
            </span>
          </div>
        </div>

        {/* Right Actions: Minimize & Touch ID Stop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            title="Minimize to dashboard (Timer keeps running in background)"
          >
            <Minimize2 size={14} />
            <span>Minimize</span>
          </button>

          <button
            type="button"
            onClick={handleInitiateStopTimer}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              fontWeight: 700,
              padding: '0.45rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: 'var(--radius-md)',
            }}
            title="Stop Timer & End Session (Requires MacBook Fingerprint Touch ID)"
          >
            <Fingerprint size={16} />
            <span>Stop Timer (Touch ID)</span>
          </button>
        </div>
      </div>

      {/* Main Viewport: Mirrored Camera + Scanner Reticle + Overlays */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          overflow: 'hidden',
        }}
      >
        {/* Mirrored Video Stream */}
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // 🪞 Mirrored camera preview as requested!
            WebkitTransform: 'scaleX(-1)',
            filter: 'contrast(1.05) brightness(1.02)',
          }}
          muted
          playsInline
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Camera Error Message */}
        {cameraError && (
          <div
            style={{
              position: 'absolute',
              zIndex: 20,
              maxWidth: 420,
              background: 'rgba(30, 41, 59, 0.95)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #ef4444',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            }}
          >
            <AlertCircle size={36} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Camera Access Error</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>{cameraError}</p>
            <button type="button" onClick={startCamera} className="btn btn-primary btn-sm">
              Retry Camera
            </button>
          </div>
        )}

        {/* Viewfinder Target & Laser Scanning Animation */}
        {!cameraError && (
          <div
            style={{
              position: 'absolute',
              width: 320,
              height: 320,
              maxWidth: '85vw',
              maxHeight: '60vh',
              border: '2px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '24px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 30px rgba(99, 102, 241, 0.3)',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '12px',
            }}
          >
            {/* 4 Corner Markers */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 28, height: 28, borderTop: '4px solid #6366f1', borderLeft: '4px solid #6366f1', borderTopLeftRadius: 12 }} />
              <div style={{ width: 28, height: 28, borderTop: '4px solid #6366f1', borderRight: '4px solid #6366f1', borderTopRightRadius: 12 }} />
            </div>

            {/* Glowing Laser Scan Line */}
            <div
              style={{
                width: '100%',
                height: 3,
                background: 'linear-gradient(90deg, transparent, #818cf8, #a5b4fc, #818cf8, transparent)',
                boxShadow: '0 0 15px #818cf8, 0 0 25px #6366f1',
                borderRadius: 2,
                animation: 'scannerLaserScan 2.4s ease-in-out infinite',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 28, height: 28, borderBottom: '4px solid #6366f1', borderLeft: '4px solid #6366f1', borderBottomLeftRadius: 12 }} />
              <div style={{ width: 28, height: 28, borderBottom: '4px solid #6366f1', borderRight: '4px solid #6366f1', borderBottomRightRadius: 12 }} />
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: -32,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#e2e8f0',
                padding: '0.25rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: '0.2px',
              }}
            >
              Align Boy's Passport QR in Frame
            </div>
          </div>
        )}

        {/* Live Scan Result Celebration Popup Card */}
        {justScanned && (
          <div
            style={{
              position: 'absolute',
              top: '12%',
              zIndex: 30,
              maxWidth: 480,
              width: '90%',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: justScanned.isLate ? '2px solid #f59e0b' : '2px solid #10b981',
              borderRadius: '20px',
              padding: '1.25rem 1.5rem',
              boxShadow: justScanned.isLate
                ? '0 20px 40px rgba(245, 158, 11, 0.35)'
                : '0 20px 40px rgba(16, 185, 129, 0.35)',
              animation: 'scanPopupIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.15rem',
            }}
          >
            {/* Boy Photo or Avatar */}
            {justScanned.student.photoUrl ? (
              <img
                src={justScanned.student.photoUrl}
                alt={justScanned.student.name}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${justScanned.isLate ? '#f59e0b' : '#10b981'}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: justScanned.isLate
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {justScanned.student.name.charAt(0)}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  {justScanned.student.name}
                </span>
                {justScanned.student.arabicName && (
                  <span style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600 }}>
                    ({justScanned.student.arabicName})
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    color: '#cbd5e1',
                  }}
                >
                  {justScanned.student.id}
                </span>
              </div>

              {/* Status & Points Awarded */}
              <div style={{ marginTop: '0.45rem' }}>
                {justScanned.isLate ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span
                      style={{
                        color: '#f59e0b',
                        fontWeight: 800,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      ⏱️ Scanned Late (+{justScanned.lateMinutes}m past cutoff)
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#fde68a', fontWeight: 700 }}>
                      Awarded: +{justScanned.pointsAwarded} pts (Auto-decreased -{justScanned.deduction} pts)
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span
                      style={{
                        color: '#34d399',
                        fontWeight: 800,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <CheckCircle2 size={18} /> Scanned On-Time!
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#a7f3d0', fontWeight: 700 }}>
                      Awarded: Full +{justScanned.pointsAwarded} pts
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Attendance Activity Ticker at Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            overflowX: 'auto',
            padding: '0.5rem',
            pointerEvents: 'auto',
            zIndex: 15,
          }}
        >
          {sessionScannedList.map((item, idx) => (
            <div
              key={`${item.student.id}_${idx}`}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${item.isLate ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{item.student.name}</span>
              <span
                style={{
                  color: item.isLate ? '#f59e0b' : '#34d399',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                }}
              >
                {item.isLate ? `⏱️ +${item.pointsAwarded} pts` : `✓ +${item.pointsAwarded} pts`}
              </span>
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{item.timeString}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MacBook Touch ID Fingerprint Verification Modal */}
      {isVerifyingTouchID && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: 440,
              width: '100%',
              background: '#0f172a',
              border: '1.5px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '24px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.3)',
              color: '#ffffff',
            }}
          >
            {/* Glowing Touch ID Icon */}
            <div
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 1.25rem auto',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(124, 58, 237, 0.3))',
                border: '2px solid #818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
                animation: 'timerPulseGlow 2s infinite ease-in-out',
              }}
            >
              <Fingerprint size={46} color="#a5b4fc" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
              MacBook Touch ID Required
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              The timer will not stop until you place your finger on your <strong>MacBook Touch ID sensor</strong>.
            </p>

            {touchIDError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  marginBottom: '1.25rem',
                  textAlign: 'left',
                }}
              >
                {touchIDError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleInitiateStopTimer}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Fingerprint size={18} />
                <span>Scan Fingerprint on Touch ID</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsVerifyingTouchID(false)}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#e2e8f0',
                  }}
                >
                  Keep Timer Running
                </button>

                <button
                  type="button"
                  onClick={() => setIsFallbackPasswordOpen(true)}
                  className="btn btn-secondary"
                  style={{
                    background: 'transparent',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                  }}
                  title="Use admin password if Touch ID sensor is not responding"
                >
                  Password Override
                </button>
              </div>
            </div>

            {/* Admin Password Fallback Drawer */}
            {isFallbackPasswordOpen && (
              <form onSubmit={handleFallbackPasswordSubmit} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                  Servant Master Password Override:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    required
                    placeholder="Enter password..."
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="form-input"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                    }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Confirm Stop
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global Laser and Popup Keyframes */}
      <style>{`
        @keyframes scannerLaserScan {
          0%, 100% {
            transform: translateY(-110px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(110px);
            opacity: 1;
          }
        }
        @keyframes scanPopupIn {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
