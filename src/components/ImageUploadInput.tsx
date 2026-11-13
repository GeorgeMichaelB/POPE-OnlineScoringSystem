import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Link, Check } from 'lucide-react';

interface ImageUploadInputProps {
  label: string;
  value?: string;
  onChange: (dataUrlOrUrl: string) => void;
  helperText?: string;
  aspectRatio?: 'square' | 'banner' | 'auto';
  maxDimension?: number;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  helperText = 'ارفع صورة من جهازك أو اكتب رابط مباشر (JPG, PNG, WebP)',
  aspectRatio = 'auto',
  maxDimension = 900,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize and compress image using HTML5 Canvas to keep storage ultra-light
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(typeof e.target?.result === 'string' ? e.target.result : '');
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.84);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = typeof e.target?.result === 'string' ? e.target.result : '';
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressImage(file);
      onChange(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
      // Fallback: direct read
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          onChange(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setUrlDraft('');
      setShowUrlInput(false);
    }
  };

  const previewHeight = aspectRatio === 'banner' ? 140 : aspectRatio === 'square' ? 100 : 120;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>
        {label}
      </label>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {value ? (
        /* Image Preview Box */
        <div
          style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            background: '#090d16',
            maxHeight: previewHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
        >
          <img
            src={value}
            alt="Uploaded Preview"
            style={{
              width: '100%',
              height: previewHeight,
              objectFit: aspectRatio === 'banner' ? 'cover' : 'contain',
              background: '#0f172a',
            }}
          />

          {/* Action Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              display: 'flex',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="تغيير الصورة"
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Upload size={12} /> تغيير
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              title="حذف الصورة"
              style={{
                background: 'rgba(239, 68, 68, 0.85)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Trigger Card */
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1.5px dashed rgba(148, 163, 184, 0.25)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Upload size={15} />
              <span>{isProcessing ? 'جاري معالجة الصورة...' : 'رفع صورة من الجهاز'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                padding: '0.55rem 0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Link size={14} />
              <span>رابط صورة</span>
            </button>
          </div>

          {showUrlInput && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '0.75rem' }}>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                style={{
                  flex: 1,
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  color: '#fff',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={14} /> إضافة
              </button>
            </div>
          )}

          {helperText && (
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.45rem' }}>
              <ImageIcon size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
              {helperText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
