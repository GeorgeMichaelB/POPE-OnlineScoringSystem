import React, { useState, useRef } from 'react';
import { X, Download, Upload, RefreshCw, User, Database, Check } from 'lucide-react';
import { db } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServantName: string;
  onUpdateServantName: (name: string) => void;
  onDataChanged: () => void;
  onOpenInstallModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentServantName,
  onUpdateServantName,
  onDataChanged,
  onOpenInstallModal,
}) => {
  const [servantName, setServantName] = useState(currentServantName);
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (servantName.trim()) {
      onUpdateServantName(servantName.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
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
                  placeholder="e.g. Servant Mina"
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
