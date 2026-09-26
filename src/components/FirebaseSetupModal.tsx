import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Trash2,
  X,
  HelpCircle,
} from 'lucide-react';
import { cloudSync, type FirebaseConfig, type CloudSyncStatus } from '../services/firebase';
import { db } from '../services/db';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
  currentClassId?: string;
  className?: string;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  currentClassId = 'class_popesaweros',
  className = 'Pope Saweros Class',
}) => {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });

  const [rawJson, setRawJson] = useState('');
  const [status, setStatus] = useState<CloudSyncStatus>('not_configured');
  const [statusMsg, setStatusMsg] = useState('');
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'guide'>('config');

  useEffect(() => {
    if (!isOpen) return;

    const saved = cloudSync.getSavedConfig();
    if (saved) {
      setConfig(saved);
      setRawJson(JSON.stringify(saved, null, 2));
    }

    const currentStatus = cloudSync.getStatus();
    setStatus(currentStatus.status);
    setStatusMsg(currentStatus.message);

    const unsub = cloudSync.onStatusChange((newStatus, msg) => {
      setStatus(newStatus);
      if (msg) setStatusMsg(msg);
    });

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-parse pasted snippet (supports raw JSON, JS object syntax, or const firebaseConfig = {...})
  const handleParseSnippet = (text: string) => {
    setRawJson(text);
    if (!text.trim()) return;

    try {
      // Clean up common JS wrappers
      let cleaned = text
        .replace(/const\s+firebaseConfig\s*=\s*/i, '')
        .replace(/export\s+const\s+firebaseConfig\s*=\s*/i, '')
        .replace(/var\s+firebaseConfig\s*=\s*/i, '')
        .replace(/let\s+firebaseConfig\s*=\s*/i, '')
        .replace(/;+\s*$/, '')
        .trim();

      // Convert unquoted JS keys to valid JSON keys
      // e.g. apiKey: "xxx" -> "apiKey": "xxx"
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      // Replace single quotes with double quotes
      cleaned = cleaned.replace(/'([^']*)'/g, '"$1"');

      const parsed = JSON.parse(cleaned);
      if (parsed.projectId || parsed.apiKey) {
        setConfig((prev) => ({
          apiKey: parsed.apiKey || prev.apiKey,
          authDomain: parsed.authDomain || prev.authDomain,
          projectId: parsed.projectId || prev.projectId,
          storageBucket: parsed.storageBucket || prev.storageBucket,
          messagingSenderId: parsed.messagingSenderId || prev.messagingSenderId,
          appId: parsed.appId || prev.appId,
          databaseURL: parsed.databaseURL || prev.databaseURL,
        }));
        setActionFeedback({
          type: 'success',
          text: '✓ Successfully parsed Firebase credentials from pasted snippet!',
        });
      }
    } catch {
      // Allow manual typing if parse fails
    }
  };

  const handleSaveAndConnect = async () => {
    if (!config.projectId.trim() || !config.apiKey.trim()) {
      setActionFeedback({
        type: 'error',
        text: 'Please provide both Project ID and API Key.',
      });
      return;
    }

    setTesting(true);
    setActionFeedback({ type: 'info', text: 'Connecting to Google Firebase Firestore...' });

    const res = await cloudSync.saveConfig(config);
    setTesting(false);

    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: '🎉 Connected to Firebase Cloud! Multi-device sync is now active.',
      });
      if (onSyncComplete) onSyncComplete();
    } else {
      setActionFeedback({
        type: 'error',
        text: `Connection failed: ${res.message}`,
      });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setActionFeedback({ type: 'info', text: 'Testing cloud connection...' });
    const res = await cloudSync.init();
    setTesting(false);

    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: '✓ Connection verified! Firestore is reachable and responsive.',
      });
    } else {
      setActionFeedback({
        type: 'error',
        text: `Connection test failed: ${res.message}`,
      });
    }
  };

  const handleUploadLocalData = async () => {
    if (!cloudSync.isConfigured()) {
      setActionFeedback({
        type: 'error',
        text: 'Please connect to Firebase before uploading local data.',
      });
      return;
    }

    const confirmUpload = window.confirm(
      `Push all current local students, attendance, and scores from this computer to the cloud?\n\nThis will make all current data available to all other servants' phones immediately.`
    );
    if (!confirmUpload) return;

    setUploading(true);
    setActionFeedback({
      type: 'info',
      text: 'Exporting local class data and uploading to Firebase Cloud...',
    });

    try {
      const localSnapshot = await db.exportLocalClassSnapshot(currentClassId);
      const res = await cloudSync.uploadLocalDataToCloud(currentClassId, localSnapshot);
      setUploading(false);

      if (res.success) {
        setActionFeedback({
          type: 'success',
          text: `🎉 ${res.message}`,
        });
        if (onSyncComplete) onSyncComplete();
      } else {
        setActionFeedback({
          type: 'error',
          text: `Upload failed: ${res.message}`,
        });
      }
    } catch (err: any) {
      setUploading(false);
      setActionFeedback({
        type: 'error',
        text: `Upload error: ${err?.message || 'Unknown error'}`,
      });
    }
  };

  const handleDisconnect = () => {
    const confirmDisc = window.confirm(
      'Are you sure you want to disconnect Firebase? The app will operate in local offline mode only on this device.'
    );
    if (!confirmDisc) return;

    cloudSync.clearConfig();
    setConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    });
    setRawJson('');
    setActionFeedback({
      type: 'info',
      text: 'Cloud configuration removed. App is now in local offline mode.',
    });
  };

  const copyRuleSnippet = (snippet: string, stepNum: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedStep(stepNum);
    setTimeout(() => setCopiedStep(null), 2500);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '740px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background:
                  status === 'connected'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${status === 'connected' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: status === 'connected' ? '#10b981' : '#38bdf8',
              }}
            >
              {status === 'connected' ? <CloudCheck size={24} /> : <Cloud size={24} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                Cloud Real-time Synchronization
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Firebase Cloud Firestore • Sync across all servants in {className}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#cbd5e1',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background:
              status === 'connected'
                ? 'rgba(16, 185, 129, 0.1)'
                : status === 'connecting'
                ? 'rgba(245, 158, 11, 0.1)'
                : status === 'error'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(148, 163, 184, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor:
                  status === 'connected'
                    ? '#10b981'
                    : status === 'connecting'
                    ? '#f59e0b'
                    : status === 'error'
                    ? '#ef4444'
                    : '#94a3b8',
                boxShadow: status === 'connected' ? '0 0 10px #10b981' : 'none',
              }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>
              {status === 'connected' && `🟢 Live Cloud Synced (Firebase Firestore)${statusMsg ? ` - ${statusMsg}` : ''}`}
              {status === 'connecting' && `🟡 Connecting to Cloud...${statusMsg ? ` (${statusMsg})` : ''}`}
              {status === 'error' && `🔴 Connection Error${statusMsg ? `: ${statusMsg}` : ''}`}
              {status === 'not_configured' && '⚪ Local Offline Mode (Cloud Not Configured)'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {status === 'connected' && (
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            )}
            <button
              onClick={() => setActiveTab(activeTab === 'config' ? 'guide' : 'config')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <HelpCircle size={14} />
              {activeTab === 'config' ? 'View Setup Guide' : 'Back to Settings'}
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              background:
                actionFeedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : actionFeedback.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
              color:
                actionFeedback.type === 'success'
                  ? '#34d399'
                  : actionFeedback.type === 'error'
                  ? '#f87171'
                  : '#60a5fa',
              fontSize: '0.85rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{actionFeedback.text}</span>
            <button
              onClick={() => setActionFeedback(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                opacity: 0.8,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {activeTab === 'guide' ? (
            /* STEP-BY-STEP SETUP GUIDE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <Shield size={20} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  <strong>Why Firebase Cloud?</strong>
                  <p style={{ margin: '0.35rem 0 0 0', color: '#cbd5e1' }}>
                    Firebase Firestore is Google's free cloud database. It gives your Sunday School class
                    instant multi-device sync across every servant's phone (iPhone / Android) and laptop,
                    whether on 4G cellular data or church Wi-Fi.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                  Quick 3-Minute Setup Instructions:
                </h3>

                {/* Step 1 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.92rem' }}>
                      Step 1: Create a Free Firebase Project
                    </span>
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.82rem',
                        color: '#38bdf8',
                        textDecoration: 'none',
                      }}
                    >
                      Open Firebase Console <ExternalLink size={13} />
                    </a>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Sign in with your Google account, click <strong>"Add Project"</strong>, name it{' '}
                    <em>"Pope Saweros Class"</em>, and click Continue (Google Analytics is optional).
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.92rem' }}>
                    Step 2: Create Firestore Database
                  </span>
                  <p style={{ margin: '0.5rem 0 0.5rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    In the left sidebar under <strong>Build</strong>, click <strong>Firestore Database</strong> →{' '}
                    <strong>Create Database</strong>. Choose your location, select{' '}
                    <strong>"Start in test mode"</strong> (allows servants to read/write), and click Enable.
                  </p>
                  <div
                    style={{
                      background: '#090d16',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      color: '#a7f3d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>rules_version = '2'; service cloud.firestore &#123; match /databases/&#123;database&#125;/documents &#123; match /&#123;document=**&#125; &#123; allow read, write: if true; &#125; &#125; &#125;</span>
                    <button
                      onClick={() =>
                        copyRuleSnippet(
                          `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`,
                          2
                        )
                      }
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '0.2rem 0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                      }}
                    >
                      {copiedStep === 2 ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      {copiedStep === 2 ? 'Copied' : 'Copy Rule'}
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.92rem' }}>
                    Step 3: Register Web App & Get Keys
                  </span>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Click the <strong>Project Settings (gear ⚙️)</strong> icon in the top-left → Under{' '}
                    <strong>"Your apps"</strong>, click the Web icon (<strong>&lt;/&gt;</strong>). Give it a name{' '}
                    <em>"SundaySchoolWeb"</em>. Firebase will display your <code>firebaseConfig</code> object.
                  </p>
                </div>

                {/* Step 4 */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.92rem' }}>
                    Step 4: Paste & Click Connect!
                  </span>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Copy the <code>firebaseConfig</code> snippet and paste it into the Settings tab. Then click{' '}
                    <strong>"Save & Connect"</strong>, followed by{' '}
                    <strong>"Push Local Data to Cloud"</strong> to seed the database!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* CONFIGURATION & MIGRATION FORM */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Push Local Data to Cloud Card */}
              {status === 'connected' && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '14px',
                    padding: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#34d399', fontWeight: 700 }}>
                      📤 One-Click Cloud Upload (Seed Database)
                    </h4>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      Upload this computer's 28 students, current attendance, and scores to Firebase Cloud so
                      other devices can see everything immediately.
                    </p>
                  </div>
                  <button
                    onClick={handleUploadLocalData}
                    disabled={uploading}
                    className="btn btn-primary"
                    style={{
                      background: '#10b981',
                      borderColor: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 700,
                      padding: '0.6rem 1.1rem',
                    }}
                  >
                    <UploadCloud size={18} />
                    {uploading ? 'Uploading Data...' : 'Push Local Data to Cloud'}
                  </button>
                </div>
              )}

              {/* Quick Paste Snippet Area */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>
                    Paste Firebase Config Snippet (Auto-Parses JSON & JS):
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Copy directly from Firebase Console
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={rawJson}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder={`Paste snippet here, e.g.:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "pop-saweros-class",\n  authDomain: "pop-saweros-class.firebaseapp.com",\n  ...\n};`}
                  className="form-input"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    borderRadius: '10px',
                    padding: '0.75rem',
                  }}
                />
              </div>

              {/* Individual Input Fields */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Project ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={config.projectId}
                    onChange={(e) => setConfig({ ...config, projectId: e.target.value.trim() })}
                    placeholder="e.g. pop-saweros-class"
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    API Key <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                    placeholder="AIzaSy..."
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={config.authDomain || ''}
                    onChange={(e) => setConfig({ ...config, authDomain: e.target.value.trim() })}
                    placeholder="project-id.firebaseapp.com"
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={config.storageBucket || ''}
                    onChange={(e) => setConfig({ ...config, storageBucket: e.target.value.trim() })}
                    placeholder="project-id.appspot.com"
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  {cloudSync.isConfigured() && (
                    <button
                      onClick={handleDisconnect}
                      className="btn btn-secondary btn-sm"
                      style={{
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Trash2 size={14} />
                      Disconnect Cloud
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button onClick={onClose} className="btn btn-secondary">
                    Close
                  </button>
                  <button
                    onClick={handleSaveAndConnect}
                    disabled={testing}
                    className="btn btn-primary"
                    style={{
                      background: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    {testing ? 'Connecting...' : 'Save & Connect'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
