import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, SwitchCamera, Check } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Photo: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPreview(null);
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser.');
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
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera.';
      setError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const takeSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setCapturedPreview(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} color="var(--color-primary)" />
            <h3 className="modal-title">Take Visit Photo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem', textAlign: 'center' }}>
          {capturedPreview ? (
            <div>
              <img
                src={capturedPreview}
                alt="Captured visit moment"
                style={{
                  width: '100%',
                  maxHeight: '340px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginTop: '1rem',
                }}
              >
                <button type="button" onClick={handleRetake} className="btn btn-secondary">
                  Retake
                </button>
                <button type="button" onClick={handleConfirm} className="btn btn-primary">
                  <Check size={16} /> Attach to Visit
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  width: '100%',
                  height: 300,
                  background: '#000',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {error ? (
                  <p style={{ color: '#f87171', padding: '1rem' }}>{error}</p>
                ) : (
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    playsInline
                  />
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="btn btn-secondary btn-sm"
                  title="Switch Camera"
                >
                  <SwitchCamera size={16} /> Flip
                </button>

                <button
                  type="button"
                  onClick={takeSnap}
                  className="btn btn-primary"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                  }}
                >
                  <Camera size={18} /> Capture Photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
