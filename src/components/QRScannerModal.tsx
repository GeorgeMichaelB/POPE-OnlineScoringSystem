import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, SwitchCamera, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { sound } from '../services/sound';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (qrCode: string) => void;
  title?: string;
  continuous?: boolean;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Passport QR Code',
  continuous = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanCooldownRef = useRef<boolean>(false);

  // Start Camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser. You can upload an image or type the ID.');
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
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      const message = err instanceof Error ? err.message : 'Could not access device camera.';
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
          const scannedData = code.data.trim();
          handleSuccessfulScan(scannedData);

          if (!continuous) {
            return; // stop scanning loop if single scan
          }
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tick);
  };

  const handleSuccessfulScan = (code: string) => {
    sound.playSuccessChime();
    setLastScanned(code);
    scanCooldownRef.current = true;
    onScan(code);

    // Cooldown before next scan in continuous mode
    setTimeout(() => {
      scanCooldownRef.current = false;
      setLastScanned(null);
    }, 2000);

    if (!continuous) {
      onClose();
    }
  };

  // Upload an image with QR code
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleSuccessfulScan(code.data.trim());
        } else {
          alert('No QR code detected in the selected image. Please try a clearer picture or enter ID manually.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccessfulScan(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="var(--color-primary)" />
            <h3 className="modal-title">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.3rem' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem', textAlign: 'center' }}>
          {/* Camera Viewport */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 280,
              background: '#000',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraError ? 'none' : 'block',
              }}
              muted
              playsInline
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Target Reticle */}
            {!cameraError && (
              <div
                style={{
                  position: 'absolute',
                  width: 190,
                  height: 190,
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '90%',
                    height: '2px',
                    background: 'rgba(59, 130, 246, 0.8)',
                    boxShadow: '0 0 8px #3b82f6',
                  }}
                />
              </div>
            )}

            {/* Scanned Badge */}
            {lastScanned && (
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  background: 'rgba(5, 150, 105, 0.95)',
                  color: 'white',
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <CheckCircle size={16} /> Scanned: {lastScanned}
              </div>
            )}

            {/* Camera error fallback */}
            {cameraError && (
              <div
                style={{
                  padding: '1.5rem',
                  color: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <AlertCircle size={36} color="#e2e8f0" />
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Camera access error: {cameraError}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn btn-secondary btn-sm"
                  style={{ background: '#334155', color: '#f8fafc', border: 'none' }}
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={toggleCamera}
              className="btn btn-secondary btn-sm"
              title="Flip Camera"
            >
              <SwitchCamera size={16} /> Flip Camera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              title="Upload QR photo"
            >
              <Image size={16} /> Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          {/* Manual ID fallback */}
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
              textAlign: 'left',
            }}
          >
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Or type Passport ID (e.g. PASSPORT-101)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
