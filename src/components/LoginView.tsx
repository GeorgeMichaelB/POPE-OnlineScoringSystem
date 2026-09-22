import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Crown,
  ArrowRight,
  BookOpen,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { UserAccount } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  onLaunchHeroesScreen: () => void;
  getUserByUsername: (username: string) => Promise<UserAccount | null>;
  onUpdatePassword: (username: string, newPass: string) => Promise<void>;
}

const PRESET_ACCOUNTS = [
  { username: '@george.michael', label: 'George Michael (Admin)', role: 'admin' },
  { username: '@philo.ashraf', label: 'Philo Ashraf', role: 'servant' },
  { username: '@kiro.hossny', label: 'Kiro Hossny', role: 'servant' },
  { username: '@alfred.samy', label: 'Alfred Samy', role: 'servant' },
];

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onLaunchHeroesScreen,
  getUserByUsername,
  onUpdatePassword,
}) => {
  const [username, setUsername] = useState('@george.michael');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // First-time password change modal state
  const [isFirstLoginModalOpen, setIsFirstLoginModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassError, setNewPassError] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your servant username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        setErrorMsg('Invalid username. Please select or enter a valid servant account.');
        setIsLoading(false);
        return;
      }

      if (user.passwordHash !== password) {
        setErrorMsg('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check if user must change password on first login
      if (user.mustChangePassword) {
        setPendingUser(user);
        setIsFirstLoginModalOpen(true);
        setIsLoading(false);
        return;
      }

      // Direct successful login
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPassError('');

    if (!newPassword || newPassword.length < 4) {
      setNewPassError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword.toLowerCase() === 'password') {
      setNewPassError('You cannot reuse the default password. Please choose a custom password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setNewPassError('New passwords do not match. Please retype carefully.');
      return;
    }

    if (!pendingUser) return;

    setIsChangingPass(true);
    try {
      await onUpdatePassword(pendingUser.username, newPassword);
      const updatedUser: UserAccount = {
        ...pendingUser,
        passwordHash: newPassword,
        mustChangePassword: false,
      };
      setIsFirstLoginModalOpen(false);
      onLoginSuccess(updatedUser);
    } catch (err) {
      setNewPassError('Failed to update password. Please try again.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '1.5rem',
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
        position: 'relative',
      }}
    >
      {/* Background Decorative Ambience */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          top: '10%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(30, 41, 59, 0.85)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(217, 119, 6, 0.1)',
          padding: '2.25rem 2rem',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Church Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 20px rgba(217, 119, 6, 0.4)',
            }}
          >
            <BookOpen size={28} />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Pope Saweros Class
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Servant Portal • Grade 4 Sunday School
          </p>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Servant Account Selector Chips */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#cbd5e1',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Select Servant Account (اختر حسابك)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
            {PRESET_ACCOUNTS.map((acc) => {
              const isSelected = username.toLowerCase() === acc.username.toLowerCase();
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword('');
                    setErrorMsg('');
                  }}
                  style={{
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1.5px solid #f59e0b'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected
                      ? 'rgba(245, 158, 11, 0.18)'
                      : 'rgba(15, 23, 42, 0.6)',
                    color: isSelected ? '#fbbf24' : '#94a3b8',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {acc.role === 'admin' ? (
                    <Crown size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                  ) : (
                    <User size={13} style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {acc.username}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Username input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.35rem',
              }}
            >
              Username (اسم المستخدم)
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                }}
              >
                Password (كلمة المرور)
              </label>
              {username !== '@george.michael' && (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Default: <code>password</code>
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                style={{
                  width: '100%',
                  padding: '0.65rem 2.4rem 0.65rem 2.3rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
              marginTop: '0.5rem',
              transition: 'transform 0.15s ease',
            }}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Servant Portal (تسجيل الدخول)'}</span>
            <ArrowRight size={17} />
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: '1.75rem 0 1.25rem',
            color: '#64748b',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span>OR FOR CLASSROOM DISPLAY</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Quick Launch Hall of Champions Button (No login required) */}
        <button
          type="button"
          onClick={onLaunchHeroesScreen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Crown size={16} /> Launch Hall of Champions (شاشة الأولاد)
        </button>
      </div>

      {/* Mandatory First-Time Password Change Modal */}
      {isFirstLoginModalOpen && pendingUser && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '460px',
              width: '94%',
              background: '#1e293b',
              color: '#ffffff',
              borderRadius: '20px',
              border: '2px solid #f59e0b',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(245, 158, 11, 0.3)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                }}
              >
                <KeyRound size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Set Custom Password (تغيير كلمة المرور لأول مرة)
                </h2>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Welcome {pendingUser.name}! Please set your confidential password.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                color: '#cbd5e1',
                lineHeight: 1.4,
              }}
            >
              🔒 <strong>Security Requirement:</strong> For privacy and attendance safety, every servant must replace the initial temporary password (<code>password</code>) with a personal custom one.
            </div>

            {newPassError && (
              <div
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                }}
              >
                {newPassError}
              </div>
            )}

            <form onSubmit={handleConfirmPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  New Password (كلمة المرور الجديدة)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 characters)..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  Confirm New Password (تأكيد كلمة المرور الجديدة)
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype your new password..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isChangingPass ? 'wait' : 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{isChangingPass ? 'Saving...' : 'Save & Enter Class (حفظ ودخول الفصل)'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
