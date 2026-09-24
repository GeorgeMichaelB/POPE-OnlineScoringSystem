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
  AlertCircle,
  School,
  Clock,
  UserPlus,
  RefreshCw,
  LogOut,
  Sparkles,
  Users
} from 'lucide-react';
import type { UserAccount, ClassRoom } from '../types';
import { db } from '../services/db';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  onLaunchHeroesScreen: () => void;
  getUserByUsername: (username: string) => Promise<UserAccount | null>;
  onUpdatePassword: (username: string, newPass: string) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onLaunchHeroesScreen,
  getUserByUsername,
  onUpdatePassword,
}) => {
  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regClassChoice, setRegClassChoice] = useState<'create' | 'join'>('create');
  
  // Class creation fields
  const [newClassName, setNewClassName] = useState('');
  const [newClassUsername, setNewClassUsername] = useState('');
  
  // Join existing class fields
  const [joinClassUsername, setJoinClassUsername] = useState('');
  const [foundClass, setFoundClass] = useState<ClassRoom | null>(null);
  const [classCheckLoading, setClassCheckLoading] = useState(false);
  const [classCheckError, setClassCheckError] = useState('');

  // Pending approval screen state
  const [pendingApprovalUser, setPendingApprovalUser] = useState<UserAccount | null>(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // First-time password change modal state
  const [isFirstLoginModalOpen, setIsFirstLoginModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassError, setNewPassError] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Check Class Username when joining
  const handleCheckJoinClass = async (val: string) => {
    const clean = val.trim().toLowerCase().replace(/^@/, '');
    setJoinClassUsername(val);
    setFoundClass(null);
    setClassCheckError('');

    if (!clean) return;

    setClassCheckLoading(true);
    try {
      const cls = await db.getClassByUsername(clean);
      if (cls) {
        if (cls.status === 'suspended') {
          setFoundClass(null);
          setClassCheckError('⛔ This class has been suspended by the platform administrator.');
        } else {
          setFoundClass(cls);
          setClassCheckError('');
        }
      } else {
        setFoundClass(null);
        setClassCheckError('No Sunday school class found with this username.');
      }
    } catch {
      setClassCheckError('Error looking up class.');
    } finally {
      setClassCheckLoading(false);
    }
  };

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
        setErrorMsg('Invalid username. Please check your spelling or register a new account.');
        setIsLoading(false);
        return;
      }

      if (user.passwordHash !== password) {
        setErrorMsg('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check if user is pending approval for their class
      if (user.status === 'pending') {
        setPendingApprovalUser(user);
        setIsLoading(false);
        return;
      }

      if (user.status === 'rejected') {
        setErrorMsg('Your request to join this class was declined by the class admin. Contact your admin or create a new class.');
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

      // Check if user is a superadmin (@george.dev)
      if (user.role === 'superadmin' || user.username.toLowerCase() === '@george.dev') {
        // Open the admin portal in a new window as requested
        const adminUrl = `${window.location.origin}${window.location.pathname}?view=superadmin`;
        if (!window.location.search.includes('view=superadmin')) {
          window.open(adminUrl, '_blank', 'noopener,noreferrer');
        }
        onLoginSuccess(user);
        setIsLoading(false);
        return;
      }

      // Check if user's class has been suspended
      if (user.classId) {
        const cls = await db.getClassById(user.classId);
        if (cls?.status === 'suspended') {
          setErrorMsg('⛔ This Sunday School class has been SUSPENDED by the platform administrator. You cannot log in or record scores. Please contact church leadership.');
          setIsLoading(false);
          return;
        }
      }

      // Successful login
      onLoginSuccess(user);
    } catch {
      setErrorMsg('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim()) {
      setErrorMsg('Please enter your full servant name.');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Servant username must be at least 3 characters.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-type carefully.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check servant username availability
      const existingUser = await db.getUserByUsername(`@${cleanUsername}`);
      if (existingUser) {
        setErrorMsg(`Username "@${cleanUsername}" is already registered. Please choose another.`);
        setIsLoading(false);
        return;
      }

      if (regClassChoice === 'create') {
        // --- Option A: Create New Class (Becomes Class Admin) ---
        if (!newClassName.trim()) {
          setErrorMsg('Please enter a name for your new class.');
          setIsLoading(false);
          return;
        }

        const cleanClassUsername = newClassUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_-]/g, '');
        if (!cleanClassUsername || cleanClassUsername.length < 3) {
          setErrorMsg('Class username must be at least 3 alphanumeric characters (e.g. stmina5, popeshenouda).');
          setIsLoading(false);
          return;
        }

        const available = await db.checkClassUsernameAvailable(cleanClassUsername);
        if (!available) {
          setErrorMsg(`Class username "@${cleanClassUsername}" is already taken. Please pick another class username.`);
          setIsLoading(false);
          return;
        }

        // Create the class
        const newClass = await db.createClass(
          newClassName.trim(),
          cleanClassUsername,
          `@${cleanUsername}`,
          `Sunday School Class created by ${regName.trim()}`
        );

        // Register the servant as Class Admin
        const newUser = await db.registerUser({
          name: regName.trim(),
          username: `@${cleanUsername}`,
          password: regPassword,
          role: 'admin',
          classId: newClass.id,
          classUsername: newClass.username,
          status: 'approved',
        });

        onLoginSuccess(newUser);
      } else {
        // --- Option B: Join Existing Class (Requires Admin Approval) ---
        const cleanClassUsername = joinClassUsername.trim().toLowerCase().replace(/^@/, '');
        if (!cleanClassUsername) {
          setErrorMsg('Please enter the unique class username to join.');
          setIsLoading(false);
          return;
        }

        const targetClass = await db.getClassByUsername(cleanClassUsername);
        if (!targetClass) {
          setErrorMsg(`No class found with username "@${cleanClassUsername}". Please check with your class admin.`);
          setIsLoading(false);
          return;
        }

        if (targetClass.status === 'suspended') {
          setErrorMsg('⛔ This Sunday School class has been SUSPENDED by the platform administrator. Joining is disabled.');
          setIsLoading(false);
          return;
        }

        // Register the servant as pending servant
        const newUser = await db.registerUser({
          name: regName.trim(),
          username: `@${cleanUsername}`,
          password: regPassword,
          role: 'servant',
          classId: targetClass.id,
          classUsername: targetClass.username,
          status: 'pending',
        });

        // Set pending approval view
        setPendingApprovalUser(newUser);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPendingStatus = async () => {
    if (!pendingApprovalUser) return;
    setIsRefreshingStatus(true);
    try {
      const refreshed = await db.getUserByUsername(pendingApprovalUser.username);
      if (refreshed) {
        if (refreshed.status === 'approved') {
          setPendingApprovalUser(null);
          onLoginSuccess(refreshed);
          return;
        }
        setPendingApprovalUser(refreshed);
      }
    } finally {
      setIsRefreshingStatus(false);
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
    } catch {
      setNewPassError('Failed to update password. Please try again.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // --- Render Pending Approval Gate Screen ---
  if (pendingApprovalUser) {
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
        }}
      >
        <div
          className="auth-portal-card"
          style={{
            width: '100%',
            maxWidth: 480,
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '20px',
            padding: '2.25rem 2rem',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 158, 11, 0.15)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
            }}
          >
            <Clock size={34} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem' }}>
            Awaiting Admin Approval
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            Welcome, <strong>{pendingApprovalUser.name}</strong>! Your account has been registered, and your request to join{' '}
            <strong style={{ color: '#fbbf24' }}>@{pendingApprovalUser.classUsername}</strong> is currently pending.
          </p>

          <div
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1.75rem',
              textAlign: 'left',
              fontSize: '0.825rem',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Servant Username:</span>
              <strong style={{ color: '#e2e8f0' }}>{pendingApprovalUser.username}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Target Class:</span>
              <strong style={{ color: '#fbbf24' }}>@{pendingApprovalUser.classUsername}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Status:</span>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                ⏳ PENDING APPROVAL
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem' }}>
            Please ask the Class Admin to approve your servant account inside their portal. Once approved, click Check Status.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleRefreshPendingStatus}
              disabled={isRefreshingStatus}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              <RefreshCw size={17} className={isRefreshingStatus ? 'spin' : ''} />
              {isRefreshingStatus ? 'Checking Status...' : 'Check Status / Refresh'}
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingApprovalUser(null);
                setUsername('');
                setPassword('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <LogOut size={15} /> Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Authentication Portal ---
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
      {/* Background Ambience */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '25%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '25%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Main Glass Card */}
      <div
        className="auth-portal-card"
        style={{
          width: '100%',
          maxWidth: authMode === 'register' ? 520 : 460,
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '2.25rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.1)',
          position: 'relative',
          zIndex: 1,
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* Church Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 58,
              height: 58,
              margin: '0 auto 0.75rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(245, 158, 11, 0.15)',
            }}
          >
            <BookOpen size={28} color="#fbbf24" />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.3px',
            }}
          >
            Sunday School SaaS Portal
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Multi-Class Church Scoring & Attendance System
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
            }}
            style={{
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              background: authMode === 'login' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: authMode === 'login' ? '#fbbf24' : '#94a3b8',
              fontWeight: authMode === 'login' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Lock size={14} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
            }}
            style={{
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              background: authMode === 'register' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: authMode === 'register' ? '#fbbf24' : '#94a3b8',
              fontWeight: authMode === 'register' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <UserPlus size={14} /> Create Account
          </button>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= MODE: LOGIN ================= */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.4rem',
                }}
              >
                Servant Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Enter username (@username)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.4rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                transition: 'opacity 0.2s ease',
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Portal'}
              {!isLoading && <ArrowRight size={17} />}
            </button>

          </form>
        )}

        {/* ================= MODE: REGISTER ================= */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Servant Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.3rem',
                }}
              >
                Servant Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter servant full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Servant Username */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.3rem',
                }}
              >
                Servant Username * (Unique)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. @servant.username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password & Confirm Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '0.3rem',
                  }}
                >
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 4 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '0.3rem',
                  }}
                >
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Class Action Selector: Create New Class vs Join Existing Class */}
            <div style={{ marginTop: '0.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#fbbf24',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Choose Class Action:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setRegClassChoice('create')}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: regClassChoice === 'create' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: regClassChoice === 'create' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    color: regClassChoice === 'create' ? '#fbbf24' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: regClassChoice === 'create' ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Crown size={18} color={regClassChoice === 'create' ? '#fbbf24' : '#64748b'} />
                  <span>Create Class</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>(Class Admin)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegClassChoice('join')}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: regClassChoice === 'join' ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: regClassChoice === 'join' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    color: regClassChoice === 'join' ? '#93c5fd' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: regClassChoice === 'join' ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Users size={18} color={regClassChoice === 'join' ? '#93c5fd' : '#64748b'} />
                  <span>Join Class</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>(Requires Approval)</span>
                </button>
              </div>

              {/* Sub-form A: Create New Class */}
              {regClassChoice === 'create' && (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>
                    <Sparkles size={14} /> You will be the Class Admin
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                      Class Display Name *
                    </label>
                    <input
                      type="text"
                      required={regClassChoice === 'create'}
                      placeholder="e.g. St. Mina Grade 5 Class"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#ffffff',
                        fontSize: '0.825rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                      Unique Class Username / Code *
                    </label>
                    <input
                      type="text"
                      required={regClassChoice === 'create'}
                      placeholder="e.g. stmina5"
                      value={newClassUsername}
                      onChange={(e) => setNewClassUsername(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#fbbf24',
                        fontWeight: 700,
                        fontSize: '0.825rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>
                      Other servants will use this username to request joining your class.
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-form B: Join Existing Class */}
              {regClassChoice === 'join' && (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#93c5fd', fontSize: '0.78rem', fontWeight: 700 }}>
                    <School size={14} /> Enter Class Username to Join
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                      Class Username / Handle *
                    </label>
                    <input
                      type="text"
                      required={regClassChoice === 'join'}
                      placeholder="e.g. class_username"
                      value={joinClassUsername}
                      onChange={(e) => handleCheckJoinClass(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#93c5fd',
                        fontWeight: 700,
                        fontSize: '0.825rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {classCheckLoading && (
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Looking up class...</span>
                  )}

                  {foundClass && (
                    <div
                      style={{
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                      <span>
                        Found: <strong>{foundClass.name}</strong> (Admin: {foundClass.adminUsername})
                      </span>
                    </div>
                  )}

                  {classCheckError && (
                    <div
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        fontSize: '0.72rem',
                      }}
                    >
                      {classCheckError}
                    </div>
                  )}

                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Note: The Class Admin must approve your account before you can view any class data.
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                transition: 'opacity 0.2s ease',
              }}
            >
              {isLoading
                ? 'Creating Account...'
                : regClassChoice === 'create'
                ? 'Create Account & Class'
                : 'Request to Join Class'}
              {!isLoading && <ArrowRight size={17} />}
            </button>
          </form>
        )}

        {/* Bottom Hall of Champions Button */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onLaunchHeroesScreen}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fbbf24',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              transition: 'background 0.15s ease',
            }}
          >
            <Crown size={15} /> Sunday School Hall of Champions
          </button>
        </div>
      </div>

      {/* First-time Password Change Modal */}
      {isFirstLoginModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#1e293b',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}
              >
                <KeyRound size={24} />
              </div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 700 }}>
                Set Your Custom Password
              </h3>
              <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.825rem' }}>
                For security, please create a new personalized password.
              </p>
            </div>

            {newPassError && (
              <div
                style={{
                  padding: '0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                }}
              >
                {newPassError}
              </div>
            )}

            <form onSubmit={handleConfirmPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.8rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {isChangingPass ? 'Updating...' : 'Save Password & Enter'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
