import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallSuccess?: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    // Detect if already installed/standalone
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari standalone check
      window.navigator.standalone === true;
    setIsStandalone(standaloneMode);
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) {
      alert('To install, use your browser menu (e.g. Chrome/Edge: click Install icon in address bar, or Menu -> Install Pope Saweros).');
      return;
    }

    try {
      setInstalling(true);
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccess(true);
        onInstallSuccess?.();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Install prompt failed:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Download size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem' }}>
                Install App (تثبيت التطبيق)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Pope Saweros Sunday School
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: 32, height: 32, padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {isStandalone ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <CheckCircle2 size={42} color="var(--color-success)" />
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                App is Already Installed!
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                You are currently running the Pope Saweros Sunday School App in standalone full-screen mode from your device's apps menu.
              </p>
            </div>
          ) : installedSuccess ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <CheckCircle2 size={42} color="var(--color-success)" />
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)' }}>
                Successfully Installed!
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Pope Saweros Class is now available in your applications menu and home screen for quick 1-tap launch.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* App Badge Preview Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <img
                  src="/icons/icon-192.png"
                  alt="App Icon"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pope Saweros Class</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Grade 4 Sunday School • Coptic Orthodox
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '2px' }}>
                    ✓ Offline Ready • Fast Camera Scan • Full-Screen
                  </div>
                </div>
              </div>

              {/* iOS Instructions */}
              {isIOS ? (
                <div
                  style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Smartphone size={16} color="var(--color-accent)" />
                    How to install on iPhone & iPad (Safari):
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <span>
                      Tap the <strong>Share</strong> button <Share size={15} style={{ display: 'inline', verticalAlign: '-2px', color: '#2563eb' }} /> in Safari's bottom toolbar.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <span>
                      Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={15} style={{ display: 'inline', verticalAlign: '-2px' }} />.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <span>
                      Tap <strong>Add</strong> in the top-right corner. The app icon will appear directly on your home screen!
                    </span>
                  </div>
                </div>
              ) : deferredPrompt ? (
                /* Native 1-Click Install Button for Android / Chrome / Edge */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Install this application to your device's apps menu for instant access, offline availability during church services, and fullscreen operation.
                  </p>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="btn btn-primary btn-lg"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                      color: 'white',
                      fontWeight: 700,
                      gap: '0.65rem',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <Download size={18} />
                    <span>{installing ? 'Installing...' : 'Install to Apps Menu (تثبيت)'}</span>
                  </button>
                </div>
              ) : (
                /* Desktop / General Browser Guidance */
                <div
                  style={{
                    padding: '0.9rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Monitor size={15} /> Desktop Installation Instructions:
                  </div>
                  <p style={{ margin: 0 }}>
                    In <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, click the <strong>Install</strong> icon in the address bar (on the right) or click the three dots menu ⋮ &rarr; <strong>"Install Pope Saweros Class"</strong>.
                  </p>
                  <p style={{ margin: 0 }}>
                    In <strong>macOS Safari</strong>, choose <strong>File</strong> &rarr; <strong>"Add to Dock..."</strong> to install as a native Mac app.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Pope Saweros Class • Online Scoring PWA
          </span>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
