import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, RefreshCw, User, Database, Check, Clock, Fingerprint, Sparkles, Cloud } from 'lucide-react';
import { db } from '../services/db';
import type { PointSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServantName: string;
  onUpdateServantName: (name: string) => void;
  onDataChanged: () => void;
  onOpenInstallModal?: () => void;
  onOpenCloudSyncModal?: () => void;
  pointSettings?: PointSettings;
  onSavePointSettings?: (settings: PointSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentServantName,
  onUpdateServantName,
  onDataChanged,
  onOpenInstallModal,
  onOpenCloudSyncModal,
  pointSettings,
  onSavePointSettings,
}) => {
  const [servantName, setServantName] = useState(currentServantName);
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Friday Class Timer & Late Progressive Penalty Settings
  const [cutoffMinutes, setCutoffMinutes] = useState(pointSettings?.fridayLateCutoffMinutes ?? 15);
  const [penaltyPoints, setPenaltyPoints] = useState(pointSettings?.fridayLatePenaltyPoints ?? 0);
  const [intervalMinutes, setIntervalMinutes] = useState(pointSettings?.fridayLateIntervalMinutes ?? 2);
  const [intervalPoints, setIntervalPoints] = useState(pointSettings?.fridayLateIntervalPoints ?? 1);
  const [deductionEnabled, setDeductionEnabled] = useState(pointSettings?.fridayLateDeductionEnabled !== false);
  const [requireTouchID, setRequireTouchID] = useState(pointSettings?.fridayLateRequireTouchID !== false);
  const [isTimerSettingsSaved, setIsTimerSettingsSaved] = useState(false);

  useEffect(() => {
    if (pointSettings) {
      setCutoffMinutes(pointSettings.fridayLateCutoffMinutes ?? 15);
      setPenaltyPoints(pointSettings.fridayLatePenaltyPoints ?? 0);
      setIntervalMinutes(pointSettings.fridayLateIntervalMinutes ?? 2);
      setIntervalPoints(pointSettings.fridayLateIntervalPoints ?? 1);
      setDeductionEnabled(pointSettings.fridayLateDeductionEnabled !== false);
      setRequireTouchID(pointSettings.fridayLateRequireTouchID !== false);
    }
  }, [pointSettings]);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (servantName.trim()) {
      onUpdateServantName(servantName.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleSaveTimerSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pointSettings || !onSavePointSettings) return;
    const updated: PointSettings = {
      ...pointSettings,
      fridayLateCutoffMinutes: Math.max(0, Number(cutoffMinutes) || 0),
      fridayLatePenaltyPoints: Math.max(0, Number(penaltyPoints) || 0),
      fridayLateIntervalMinutes: Math.max(1, Number(intervalMinutes) || 1),
      fridayLateIntervalPoints: Math.max(1, Number(intervalPoints) || 1),
      fridayLateDeductionEnabled: deductionEnabled,
      fridayLateRequireTouchID: requireTouchID,
    };
    await onSavePointSettings(updated);
    setIsTimerSettingsSaved(true);
    setTimeout(() => setIsTimerSettingsSaved(false), 2000);
  };

  const handleExportBackup = async () => {
    const jsonStr = await db.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pope_saweros_sunday_school_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await db.importFullBackup(content);
      if (res.success) {
        setImportStatus(res.message);
        onDataChanged();
      } else {
        alert(`Import failed: ${res.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = async () => {
    if (confirm('Reset system data to initial Pope Saweros class sample records?')) {
      await db.resetToSampleData();
      onDataChanged();
      alert('Reset to sample data complete!');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="var(--color-primary)" />
            <h3 className="modal-title">Servant Settings & Data Sync</h3>
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

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Servant Identity */}
          <div className="card" style={{ padding: '1rem', background: 'var(--bg-subtle)' }}>
            <form onSubmit={handleSaveName}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} /> Current Servant Name (اسم الخادم)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  required
                  value={servantName}
                  onChange={(e) => setServantName(e.target.value)}
                  className="form-input"
                  placeholder="Enter servant display name"
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  {isSaved ? <Check size={14} /> : 'Save'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                This name will be automatically signed on visits and calendar scheduling.
              </p>
            </form>
          </div>

          {/* Friday Class Timer & Late Points Configuration */}
          {pointSettings && onSavePointSettings && (
            <div
              className="card"
              style={{
                padding: '1.15rem',
                background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.6), rgba(245, 243, 255, 0.4))',
                border: '1.5px solid #c7d2fe',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-full)',
                      background: '#4f46e5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: 800, margin: 0, color: '#1e1b4b' }}>
                      Friday Class Timer & Late Penalty
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#4338ca', fontWeight: 600 }}>
                      مؤقت حضور الجمعة وخصم التأخير التلقائي
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: requireTouchID ? '#ede9fe' : '#f1f5f9',
                      color: requireTouchID ? '#6d28d9' : '#64748b',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${requireTouchID ? '#ddd6fe' : '#cbd5e1'}`,
                    }}
                    title="Enforce phone/device biometrics (Face ID, Fingerprint, Touch ID) or screen lock to stop the class timer"
                  >
                    <Fingerprint size={14} />
                    <input
                      type="checkbox"
                      checked={requireTouchID}
                      onChange={(e) => {
                        setRequireTouchID(e.target.checked);
                      }}
                    />
                    <span>Biometrics / Screen Lock Protected</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: deductionEnabled ? '#ecfdf5' : '#f1f5f9',
                      color: deductionEnabled ? '#065f46' : '#64748b',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${deductionEnabled ? '#a7f3d0' : '#cbd5e1'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={deductionEnabled}
                      onChange={(e) => {
                        setDeductionEnabled(e.target.checked);
                      }}
                    />
                    <span>{deductionEnabled ? 'Late Auto-Deduction On' : 'Deduction Off'}</span>
                  </label>
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4 }}>
                Customize your late rule: set a grace cutoff, and choose how many minutes late removes additional points (e.g. <strong>every 2 min late removes 1 point</strong>). When you start the timer, a full-screen mirrored camera preview will open, and the timer will only stop with your <strong>MacBook fingerprint</strong>!
              </p>

              <form onSubmit={handleSaveTimerSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {/* Late Cutoff / Grace Period */}
                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e0e7ff' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3730a3', marginBottom: '0.35rem' }}>
                      Grace Period Cutoff (وقت السماح الأولي)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={cutoffMinutes}
                        onChange={(e) => setCutoffMinutes(Number(e.target.value))}
                        className="form-input"
                        style={{ fontWeight: 700, fontSize: '0.95rem' }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>min</span>
                    </div>
                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {[0, 5, 10, 15, 20, 30].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCutoffMinutes(m)}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            border: cutoffMinutes === m ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                            background: cutoffMinutes === m ? '#4f46e5' : '#f8fafc',
                            color: cutoffMinutes === m ? '#ffffff' : '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interval Minutes (e.g. every 2 min) */}
                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e0e7ff' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3730a3', marginBottom: '0.35rem' }}>
                      Every X Minutes Late (كل كام دقيقة تأخير)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                        className="form-input"
                        style={{ fontWeight: 700, fontSize: '0.95rem' }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>min</span>
                    </div>
                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 5, 10].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setIntervalMinutes(mins)}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            border: intervalMinutes === mins ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                            background: intervalMinutes === mins ? '#4f46e5' : '#f8fafc',
                            color: intervalMinutes === mins ? '#ffffff' : '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Every {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Points Removed Per Interval */}
                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e0e7ff' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3730a3', marginBottom: '0.35rem' }}>
                      Remove Y Points (خصم كام نقطة)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        min="1"
                        max={pointSettings.fridayClassPoints || 10}
                        value={intervalPoints}
                        onChange={(e) => setIntervalPoints(Number(e.target.value))}
                        className="form-input"
                        style={{ fontWeight: 700, fontSize: '0.95rem' }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>pts</span>
                    </div>
                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 5].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setIntervalPoints(pts)}
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            border: intervalPoints === pts ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                            background: intervalPoints === pts ? '#4f46e5' : '#f8fafc',
                            color: intervalPoints === pts ? '#ffffff' : '#475569',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          -{pts} pt
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progressive Deduction Timeline Preview */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 0.9rem',
                    border: '1px dashed #cbd5e1',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} color="#6366f1" />
                    <span>Live Deduction Schedule (جدول النقاط والتأخير):</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#ecfdf5', padding: '0.35rem 0.5rem', borderRadius: 4, border: '1px solid #a7f3d0', color: '#065f46' }}>
                      0 – {cutoffMinutes}m:{' '}
                      <strong>{pointSettings.fridayClassPoints || 10} pts</strong> (Full)
                    </div>
                    <div style={{ background: '#fffbeb', padding: '0.35rem 0.5rem', borderRadius: 4, border: '1px solid #fde68a', color: '#92400e' }}>
                      +{intervalMinutes}m late:{' '}
                      <strong>{Math.max(0, (pointSettings.fridayClassPoints || 10) - intervalPoints)} pts</strong> (-{intervalPoints})
                    </div>
                    <div style={{ background: '#fff7ed', padding: '0.35rem 0.5rem', borderRadius: 4, border: '1px solid #fed7aa', color: '#9a3412' }}>
                      +{intervalMinutes * 2}m late:{' '}
                      <strong>{Math.max(0, (pointSettings.fridayClassPoints || 10) - intervalPoints * 2)} pts</strong> (-{intervalPoints * 2})
                    </div>
                    <div style={{ background: '#fef2f2', padding: '0.35rem 0.5rem', borderRadius: 4, border: '1px solid #fecaca', color: '#991b1b' }}>
                      +{intervalMinutes * 3}m late:{' '}
                      <strong>{Math.max(0, (pointSettings.fridayClassPoints || 10) - intervalPoints * 3)} pts</strong> (-{intervalPoints * 3})
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    💡 <strong>Timer Not Started:</strong> Full {pointSettings.fridayClassPoints || 10} pts for all boys • <strong>Stop Timer:</strong> Protected by Phone / Laptop Biometrics & Screen Lock
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.45rem 1.15rem' }}>
                    {isTimerSettingsSaved ? (
                      <>
                        <Check size={14} /> Saved Successfully!
                      </>
                    ) : (
                      'Save Late & Timer Rules'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Install to Device / Apps Menu */}
          {onOpenInstallModal && (
            <div
              className="card"
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.05), rgba(15, 23, 42, 0.02))',
                border: '1.5px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={16} color="var(--color-primary)" />
                    Install App to Device (تثبيت التطبيق)
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                    Install Pope Saweros Class on your mobile home screen or computer apps menu for offline access and fullscreen mode.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInstallModal();
                  }}
                  className="btn btn-install-pwa btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Download size={14} /> Install to Apps Menu
                </button>
              </div>
            </div>
          )}

          {/* Cloud Real-time Synchronization (Firebase) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8' }}>
                <Cloud size={18} /> Cloud Real-time Sync (Firebase)
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>
                Live sync across all servants' phones, tablets, and laptops on 4G cellular data and church Wi-Fi.
              </p>
            </div>
            {onOpenCloudSyncModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCloudSyncModal();
                }}
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Cloud size={14} /> Configure Cloud Sync
              </button>
            )}
          </div>

          {/* Sync & Share Across Servants */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Data Backup & Transfer Across Servants
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              All attendance records, boy profiles, and visit notes are saved securely in your browser's offline storage.
              Export to share the class roster with fellow servants.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <Download size={15} /> Export Class Backup (JSON)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <Upload size={15} /> Import Backup File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </div>

            {importStatus && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  color: 'var(--color-success)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                }}
              >
                {importStatus}
              </div>
            )}
          </div>

          {/* Sample Data Reset */}
          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Reset Sample Records</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Restores Pope Saweros class demo boys and records.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetSample}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
