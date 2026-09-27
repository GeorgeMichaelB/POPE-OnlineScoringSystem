import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  Activity,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cloudSync, type CloudDiagnosticInfo } from '../services/firebase';
import { syncService, type SyncActivityItem, type SyncConnectionStatus } from '../services/sync';
import { db } from '../services/db';
import type { ClassRoom, UserAccount } from '../types';

interface SyncHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom | null;
  currentUser: UserAccount | null;
  connectedServantsCount?: number;
  onDataRefreshed?: () => Promise<void>;
  showToast?: (msg: string) => void;
}

export const SyncHealthModal: React.FC<SyncHealthModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  currentUser,
  connectedServantsCount,
  onDataRefreshed,
  showToast,
}) => {
  const [diagnostic, setDiagnostic] = useState<CloudDiagnosticInfo>(cloudSync.getDiagnosticInfo());
  const [syncStatus, setSyncStatus] = useState<SyncConnectionStatus>(syncService.getStatus());
  const [isTesting, setIsTesting] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activities, setActivities] = useState<SyncActivityItem[]>(syncService.getActivityLog());

  useEffect(() => {
    if (!isOpen) return;

    setDiagnostic(cloudSync.getDiagnosticInfo());
    setSyncStatus(syncService.getStatus());
    setActivities(syncService.getActivityLog());

    const unsubActivity = syncService.onActivity(() => {
      setActivities(syncService.getActivityLog());
    });

    const unsubStatus = syncService.onStatusChange((status) => {
      setSyncStatus(status);
      setDiagnostic(cloudSync.getDiagnosticInfo());
    });

    return () => {
      unsubActivity();
      unsubStatus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await cloudSync.testConnection();
      setTestResult({
        success: res.success,
        message: res.message,
      });
      setDiagnostic(cloudSync.getDiagnosticInfo());
      setSyncStatus(syncService.getStatus());
      if (res.success && showToast) {
        showToast('✓ Successfully connected to Firebase Cloud!');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsPulling(true);
    try {
      const activeId = db.getActiveClassId();
      const res = await db.syncClassWithCloud(activeId);
      if (res.synced) {
        if (onDataRefreshed) await onDataRefreshed();
        if (showToast) showToast(`✓ Pulled ${res.count} categories from cloud!`);
      } else {
        if (showToast) showToast('Notice: Could not pull cloud data. Check connection.');
      }
    } catch (err: any) {
      if (showToast) showToast(`Pull error: ${err?.message || 'Unknown'}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushToCloud = async () => {
    setIsPushing(true);
    try {
      const activeId = db.getActiveClassId();
      const snapshot = await db.exportLocalClassSnapshot(activeId);
      const res = await cloudSync.uploadLocalDataToCloud(activeId, snapshot as any);
      if (res.success) {
        if (showToast) showToast(`✓ Successfully uploaded ${res.count} categories to cloud!`);
      } else {
        if (showToast) showToast(`Upload warning: ${res.message}`);
      }
    } catch (err: any) {
      if (showToast) showToast(`Upload error: ${err?.message || 'Unknown'}`);
    } finally {
      setIsPushing(false);
    }
  };

  const isConnected = syncStatus === 'connected' || diagnostic.status === 'connected';
  const backendLabel =
    diagnostic.backendType === 'firestore'
      ? 'Cloud Firestore'
      : diagnostic.backendType === 'rtdb'
      ? 'Realtime Database'
      : 'Local Network / Offline';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.15rem 1.4rem',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isConnected
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 95, 70, 0.03))'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(180, 83, 9, 0.03))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isConnected ? '#10b981' : '#f59e0b',
              }}
            >
              {isConnected ? <CloudCheck size={22} /> : <Cloud size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-color, #0f172a)' }}>
                Live Cloud Sync Health & Diagnostics
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                مزامنة الحضور والنقاط لحظياً بين هواتف وكمبيوترات الخدام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status Badge Card */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md, 10px)',
              background: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1.5px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
            }}
          >
            <div style={{ marginTop: '0.1rem' }}>
              {isConnected ? (
                <CheckCircle size={22} color="#10b981" />
              ) : (
                <AlertTriangle size={22} color="#ef4444" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full, 9999px)',
                    background: isConnected ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                  }}
                >
                  {isConnected ? 'Online & Live' : 'Action Required'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>
                  Engine: {backendLabel}
                </span>
              </div>
              <p
                style={{
                  margin: '0.45rem 0 0 0',
                  fontSize: '0.825rem',
                  color: isConnected ? '#065f46' : '#991b1b',
                  lineHeight: 1.45,
                }}
              >
                {diagnostic.message ||
                  (isConnected
                    ? 'All servants devices in this class are synced in real-time.'
                    : 'Cloud sync is currently not connecting to Google Firebase.')}
              </p>
            </div>
          </div>

          {/* Same Account Cross-Device Notice */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md, 10px)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.03))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <ShieldCheck size={22} color="#6366f1" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: '#3730a3', lineHeight: 1.4 }}>
              <strong>Same Account Sync Supported:</strong> You can log into{' '}
              <code style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                {currentUser?.username || '@george.michael'}
              </code>{' '}
              on your phone, tablet, and laptop simultaneously. When you mark attendance on your phone, your laptop updates in real-time.
            </div>
          </div>

          {/* Firebase Setup Guidance if Not Connected */}
          {!isConnected && (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#92400e' }}>
                How to Enable Live Sync in Firebase Console (Takes 30 Seconds):
              </h4>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#78350f', lineHeight: 1.6 }}>
                <li>
                  Open your Firebase project{' '}
                  <strong style={{ fontFamily: 'monospace' }}>{diagnostic.projectId || 'pope-saweros-system'}</strong>.
                </li>
                <li>
                  In the left sidebar, click <strong>Build</strong> → <strong>Firestore Database</strong>.
                </li>
                <li>
                  Click the <strong>Create database</strong> button.
                </li>
                <li>
                  Choose any location and select <strong>Start in test mode</strong> (or allow read/write rules).
                </li>
                <li>
                  Click <strong>Enable</strong>. Once created, click <strong>Test Connection Now</strong> below!
                </li>
              </ol>

              <div style={{ marginTop: '0.85rem' }}>
                <a
                  href={`https://console.firebase.google.com/project/${diagnostic.projectId || 'pope-saweros-system'}/firestore`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  <ExternalLink size={14} /> Open Firebase Console for {diagnostic.projectId || 'pope-saweros-system'}
                </a>
              </div>
            </div>
          )}

          {/* Test & Sync Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="btn btn-primary"
              style={{ flex: 1, minWidth: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              <RefreshCw size={15} className={isTesting ? 'spin' : ''} />
              {isTesting ? 'Testing Firebase...' : 'Test Connection Now'}
            </button>

            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={isPulling}
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              <DownloadCloud size={15} className={isPulling ? 'spin' : ''} />
              {isPulling ? 'Pulling...' : 'Pull from Cloud'}
            </button>

            <button
              type="button"
              onClick={handlePushToCloud}
              disabled={isPushing}
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              <UploadCloud size={15} className={isPushing ? 'spin' : ''} />
              {isPushing ? 'Pushing...' : 'Push to Cloud'}
            </button>
          </div>

          {testResult && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm, 6px)',
                background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
                color: testResult.success ? '#065f46' : '#991b1b',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {testResult.message}
            </div>
          )}

          {/* Device & Session Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.65rem',
              fontSize: '0.76rem',
              color: 'var(--text-muted, #64748b)',
              padding: '0.85rem',
              background: 'var(--color-bg, #f8fafc)',
              borderRadius: 'var(--radius-sm, 8px)',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>Class ID: </span>
              {currentClass?.id || db.getActiveClassId()}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>Logged In User: </span>
              {currentUser?.name || 'Servant'} ({currentUser?.username || '@servant'})
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>Device ID: </span>
              <code style={{ fontSize: '0.7rem' }}>{diagnostic.clientId ? diagnostic.clientId.slice(0, 18) : 'auto'}</code>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>Firebase Project: </span>
              <code style={{ fontSize: '0.7rem' }}>{diagnostic.projectId || 'none'}</code>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>Connected Servants/Devices: </span>
              <span>{connectedServantsCount || 1} active</span>
            </div>
          </div>

          {/* Live Sync Activity Stream */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-color, #0f172a)' }}>
                <Activity size={15} color="var(--color-primary, #4f46e5)" />
                <span>Live Synchronization Activity Feed</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                {activities.length} recent events
              </span>
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--color-surface, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {activities.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.78rem' }}>
                  No sync events logged yet. Edits made on your phone or laptop will appear here in real-time!
                </div>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      fontSize: '0.76rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          background: act.direction === 'sent' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: act.direction === 'sent' ? '#4f46e5' : '#059669',
                        }}
                      >
                        {act.direction === 'sent' ? 'Sent' : 'Received'}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-color, #1e293b)' }}>
                        {act.description || act.type}
                      </span>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>by {act.senderName}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.4rem',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--color-bg, #f8fafc)',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 1.25rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
