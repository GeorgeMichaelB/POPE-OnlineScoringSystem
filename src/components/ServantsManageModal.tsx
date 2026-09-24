import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Shield,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Sparkles,
  Trash2
} from 'lucide-react';
import type { ClassRoom, UserAccount } from '../types';
import { db } from '../services/db';

interface ServantsManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom | null;
  currentUser: UserAccount;
  onServantsUpdated?: () => void;
}

export const ServantsManageModal: React.FC<ServantsManageModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  currentUser,
  onServantsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'servants' | 'add'>('pending');
  const [pendingServants, setPendingServants] = useState<UserAccount[]>([]);
  const [activeServants, setActiveServants] = useState<UserAccount[]>([]);
  const [copiedClassUsername, setCopiedClassUsername] = useState(false);

  // New servant form state
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'servant' | 'admin'>('servant');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const isAdmin = currentUser.role === 'admin' || currentClass?.adminUsername === currentUser.username;

  const loadServants = async () => {
    if (!currentClass) return;
    const pending = await db.getPendingServantsForClass(currentClass.id);
    const approved = await db.getClassServants(currentClass.id);
    setPendingServants(pending);
    setActiveServants(approved);
  };

  useEffect(() => {
    if (isOpen && currentClass) {
      loadServants().then(async () => {
        const pending = await db.getPendingServantsForClass(currentClass.id);
        if (pending.length === 0) {
          setActiveTab('servants');
        } else {
          setActiveTab('pending');
        }
      });
    }
  }, [isOpen, currentClass]);

  if (!isOpen || !currentClass) return null;

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(currentClass.username);
    setCopiedClassUsername(true);
    setTimeout(() => setCopiedClassUsername(false), 2000);
  };

  const handleApprove = async (servantUsername: string) => {
    try {
      await db.approveServant(servantUsername);
      await loadServants();
      onServantsUpdated?.();
    } catch {
      alert('Could not approve servant.');
    }
  };

  const handleReject = async (servantUsername: string) => {
    if (!window.confirm(`Are you sure you want to reject and remove join request from ${servantUsername}?`)) {
      return;
    }
    try {
      await db.rejectServant(servantUsername);
      await loadServants();
      onServantsUpdated?.();
    } catch {
      alert('Could not reject request.');
    }
  };

  const handleRemoveServant = async (servantUsername: string) => {
    if (servantUsername === currentUser.username) {
      alert('You cannot remove yourself.');
      return;
    }
    if (!window.confirm(`Remove servant ${servantUsername} from ${currentClass.name}?`)) {
      return;
    }
    try {
      await db.removeServantFromClass(servantUsername);
      await loadServants();
      onServantsUpdated?.();
    } catch {
      alert('Could not remove servant.');
    }
  };

  const handleCreateServant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername || !newDisplayName.trim() || !newPassword.trim()) {
      setCreateError('Please complete all fields.');
      return;
    }

    if (newPassword.length < 4) {
      setCreateError('Password must be at least 4 characters.');
      return;
    }

    const existing = await db.getUserByUsername(cleanUsername);
    if (existing) {
      setCreateError('This servant username already exists. Please pick another.');
      return;
    }

    try {
      await db.registerUser({
        username: cleanUsername,
        name: newDisplayName.trim(),
        password: newPassword,
        role: newRole,
        classId: currentClass.id,
        classUsername: currentClass.username,
        status: 'approved',
      });
      setCreateSuccess(`Servant account "${newDisplayName}" created successfully! They can log in immediately.`);
      setNewDisplayName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('servant');
      await loadServants();
      onServantsUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create servant account.';
      setCreateError(msg);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 650, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1d4ed8',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>
                Manage Class Servants
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {currentClass.name} • Class Admin Portal
              </p>
            </div>
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

        {/* Unique Class Username Banner */}
        <div
          style={{
            margin: '0.75rem 1rem 0 1rem',
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Unique Class Username to Share
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#065f46', fontFamily: 'monospace' }}>
              @{currentClass.username}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 2 }}>
              Servants can join by selecting "Join Class" and typing <strong>{currentClass.username}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyUsername}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'white',
              borderColor: '#6ee7b7',
              color: '#065f46',
              fontWeight: 700,
            }}
          >
            {copiedClassUsername ? (
              <>
                <Check size={14} color="#059669" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Username
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            padding: '0 1rem',
            marginTop: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '0.65rem 1rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'pending' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'pending' ? 'var(--color-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Clock size={15} />
            Pending Approvals
            {pendingServants.length > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: 12,
                  padding: '1px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {pendingServants.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('servants')}
            style={{
              padding: '0.65rem 1rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderBottom: activeTab === 'servants' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'servants' ? 'var(--color-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Users size={15} />
            Active Servants ({activeServants.length})
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              style={{
                padding: '0.65rem 1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                borderBottom: activeTab === 'add' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'add' ? 'var(--color-primary)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <UserPlus size={15} />
              Add Servant Account
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="modal-body" style={{ padding: '1rem' }}>
          {/* TAB 1: PENDING APPROVALS */}
          {activeTab === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {pendingServants.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <UserCheck size={40} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Pending Join Requests</h4>
                  <p style={{ fontSize: '0.825rem' }}>
                    When servants create an account and join using <strong>@{currentClass.username}</strong>, their approval requests will appear here.
                  </p>
                </div>
              ) : (
                pendingServants.map((servant) => (
                  <div
                    key={servant.username}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: '#fffbeb',
                      border: '1.5px solid #fde68a',
                      borderRadius: 'var(--radius-md)',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#92400e' }}>
                          {servant.name || servant.username}
                        </strong>
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          Pending Approval
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 2 }}>
                        Username: <code>@{servant.username}</code> • Requested role: {servant.role}
                      </div>
                    </div>

                    {isAdmin ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleReject(servant.username)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          <UserX size={14} /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(servant.username)}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#16a34a', borderColor: '#15803d' }}
                        >
                          <UserCheck size={14} /> Approve Servant
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Requires Class Admin Approval
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE SERVANTS */}
          {activeTab === 'servants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {activeServants.map((servant) => {
                const isClassAdmin = servant.role === 'admin' || servant.username === currentClass.adminUsername;
                const isMe = servant.username === currentUser.username;

                return (
                  <div
                    key={servant.username}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isClassAdmin ? '#eff6ff' : '#f1f5f9',
                          color: isClassAdmin ? '#1d4ed8' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                        }}
                      >
                        {servant.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {servant.name}
                          </span>
                          {isMe && (
                            <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                              You
                            </span>
                          )}
                          {isClassAdmin && (
                            <span
                              className="badge"
                              style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                border: '1px solid #bfdbfe',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              <Shield size={10} /> Class Admin
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Username: <code>@{servant.username}</code>
                        </div>
                      </div>
                    </div>

                    {isAdmin && !isMe && !isClassAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveServant(servant.username)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        title="Remove servant from class"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: ADD NEW SERVANT DIRECTLY */}
          {activeTab === 'add' && isAdmin && (
            <form onSubmit={handleCreateServant} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Create a servant account directly for <strong>{currentClass.name}</strong>. Their account will be instantly approved and scoped to this class.
              </div>

              {createError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <AlertCircle size={15} /> {createError}
                </div>
              )}

              {createSuccess && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Sparkles size={15} /> {createSuccess}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Servant Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter servant full name"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. servant_username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Class Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'servant' | 'admin')}
                  className="form-input"
                >
                  <option value="servant">Servant (خادم فصلي)</option>
                  <option value="admin">Class Co-Admin (أمين فصل مشارك)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={15} /> Create Servant Account
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
