import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Search,
  School,
  Eye,
  Crown,
  Clock,
  Database,
  RotateCcw,
  Download,
  AlertTriangle
} from 'lucide-react';
import type { ClassRoom, UserAccount, UserRole, UserStatus, AuditLogEntry, DailyBackupSnapshot } from '../types';
import { db } from '../services/db';

interface SuperAdminPortalProps {
  currentUser: UserAccount | null;
  onExitSuperAdmin: () => void;
  onSelectClassToInspect: (classRoom: ClassRoom) => void;
  onLogout: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  currentUser,
  onExitSuperAdmin,
  onSelectClassToInspect,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'users' | 'backups' | 'audit'>('classes');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [dailyBackups, setDailyBackups] = useState<DailyBackupSnapshot[]>([]);
  const [classStats, setClassStats] = useState<Record<string, { studentsCount: number; servantsCount: number }>>({});
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);
  const [restoreConfirmModal, setRestoreConfirmModal] = useState<{ open: boolean; snapshot: DailyBackupSnapshot | null }>({
    open: false,
    snapshot: null,
  });

  // Search & Filter state
  const [classSearch, setClassSearch] = useState('');
  const [classStatusFilter, setClassStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userClassFilter, setUserClassFilter] = useState<string>('ALL');

  // Create Class Modal
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassUsername, setNewClassUsername] = useState('');
  const [newClassAdmin, setNewClassAdmin] = useState('@george.dev');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [createClassError, setCreateClassError] = useState('');
  const [createClassLoading, setCreateClassLoading] = useState(false);

  // Create User Modal
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('servant');
  const [newUserClassId, setNewUserClassId] = useState('');
  const [createUserError, setCreateUserError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const allCls = await db.getClasses();
      const allUsers = await db.getUsers();
      const allLogs = await db.getGlobalAuditLogs();
      const backups = await db.getDailyBackups();
      setClasses(allCls);
      setUsers(allUsers);
      setAuditLogs(allLogs);
      setDailyBackups(backups);

      // Load counts for each class
      const statsMap: Record<string, { studentsCount: number; servantsCount: number }> = {};
      let totalStu = 0;
      for (const c of allCls) {
        const stuCount = await db.getClassStudentsCount(c.id);
        const srvCount = allUsers.filter((u) => u.classId === c.id).length;
        statsMap[c.id] = { studentsCount: stuCount, servantsCount: srvCount };
        totalStu += stuCount;
      }
      setClassStats(statsMap);
      setTotalStudentsCount(totalStu);
    } catch (e) {
      console.error('Failed to load SuperAdmin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackupNow = async () => {
    setCreatingBackup(true);
    try {
      await db.createDailyBackupSnapshot('Manual SuperAdmin Backup Snapshot');
      await loadData();
      alert("✅ Successfully captured today's full platform backup snapshot! (Maintains rolling 3-day window)");
    } catch (err) {
      console.error('Failed to create daily backup snapshot:', err);
      alert('❌ Failed to capture backup snapshot.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleConfirmRestore = async () => {
    const snapshot = restoreConfirmModal.snapshot;
    if (!snapshot) return;

    setRestoringSnapshotId(snapshot.id);
    try {
      const res = await db.restoreFromDailyBackup(snapshot.id);
      setRestoreConfirmModal({ open: false, snapshot: null });
      await loadData();
      alert(`🎉 ${res.message}\n\nThe platform has been restored to the point-in-time from ${snapshot.date}.`);
    } catch (err: unknown) {
      console.error('Error during platform restore:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`❌ Restore failed: ${msg}`);
    } finally {
      setRestoringSnapshotId(null);
    }
  };

  const handleDownloadBackupJson = (snapshot: DailyBackupSnapshot) => {
    try {
      const blob = new Blob([snapshot.payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pope_saweros_platform_backup_${snapshot.date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download backup JSON.');
    }
  };

  const handleDeleteBackup = async (snapshot: DailyBackupSnapshot) => {
    if (!window.confirm(`Are you sure you want to delete the backup snapshot from ${snapshot.date}?`)) {
      return;
    }
    try {
      await db.deleteDailyBackup(snapshot.id);
      await loadData();
    } catch {
      alert('Failed to delete snapshot.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Class Actions
  const handleToggleSuspendClass = async (classRoom: ClassRoom) => {
    const isCurrentlySuspended = classRoom.status === 'suspended';
    const action = isCurrentlySuspended ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action.toUpperCase()} class "${classRoom.name}" (@${classRoom.username})?`)) {
      return;
    }
    try {
      await db.suspendClass(classRoom.id, !isCurrentlySuspended);
      await loadData();
    } catch {
      alert(`Failed to ${action} class.`);
    }
  };

  const handleDeleteClass = async (classRoom: ClassRoom) => {
    const verify = window.prompt(
      `⚠️ CRITICAL DANGER: You are about to permanently delete class "${classRoom.name}" (@${classRoom.username}) and all its scoped data!\n\nType the word "DELETE" to confirm:`
    );
    if (verify !== 'DELETE') {
      alert('Class deletion cancelled.');
      return;
    }
    try {
      await db.deleteClass(classRoom.id);
      await loadData();
      alert(`Class "${classRoom.name}" has been permanently deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete class.';
      alert(msg);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateClassError('');
    setCreateClassLoading(true);
    try {
      const created = await db.createClass(
        newClassName,
        newClassUsername,
        newClassAdmin,
        newClassDesc
      );
      setIsCreateClassOpen(false);
      setNewClassName('');
      setNewClassUsername('');
      setNewClassDesc('');
      await loadData();
      alert(`Class "${created.name}" created successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create class.';
      setCreateClassError(msg);
    } finally {
      setCreateClassLoading(false);
    }
  };

  // User Actions
  const handleDeleteUser = async (user: UserAccount) => {
    if (user.username === '@george.dev' || user.role === 'superadmin') {
      alert('The master SuperAdmin account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Permanently delete account for "${user.name}" (@${user.username})?`)) {
      return;
    }
    try {
      await db.deleteUser(user.username);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account.';
      alert(msg);
    }
  };

  const handleToggleUserRole = async (user: UserAccount) => {
    if (user.username === '@george.dev') return;
    const newRole: UserRole = user.role === 'admin' ? 'servant' : 'admin';
    try {
      await db.updateUserRole(user.username, newRole);
      await loadData();
    } catch {
      alert('Failed to update user role.');
    }
  };

  const handleToggleUserStatus = async (user: UserAccount) => {
    if (user.username === '@george.dev') return;
    const newStatus: UserStatus = user.status === 'approved' ? 'rejected' : 'approved';
    try {
      await db.updateUserStatus(user.username, newStatus);
      await loadData();
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    try {
      const selectedCls = classes.find((c) => c.id === newUserClassId);
      await db.registerUser({
        username: newUserUsername.trim().toLowerCase(),
        name: newUserName.trim(),
        password: newUserPassword,
        role: newUserRole,
        classId: selectedCls?.id,
        classUsername: selectedCls?.username,
        status: 'approved',
      });
      setIsCreateUserOpen(false);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole('servant');
      setNewUserClassId('');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user account.';
      setCreateUserError(msg);
    }
  };

  const handleOpenStandaloneWindow = () => {
    const url = window.location.origin + window.location.pathname + '?view=superadmin';
    window.open(url, '_blank');
  };

  // Filtered lists
  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      !classSearch ||
      c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.username.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.adminUsername.toLowerCase().includes(classSearch.toLowerCase());
    const matchesStatus =
      classStatusFilter === 'ALL' ||
      (classStatusFilter === 'active' && c.status !== 'suspended') ||
      (classStatusFilter === 'suspended' && c.status === 'suspended');
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesClass = userClassFilter === 'ALL' || u.classId === userClassFilter;
    return matchesSearch && matchesRole && matchesClass;
  });

  const activeClassesCount = classes.filter((c) => c.status !== 'suspended').length;
  const suspendedClassesCount = classes.filter((c) => c.status === 'suspended').length;

  // Security Guard: ONLY @george.dev can access this portal
  const isMasterUser = !!currentUser && (
    currentUser.username.toLowerCase() === '@george.dev' ||
    currentUser.username.toLowerCase() === 'george.dev'
  );

  if (!isMasterUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', color: '#f8fafc', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#ef4444" />
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ margin: 0, color: '#94a3b8', maxWidth: 420 }}>
          This portal is strictly restricted to the platform secret administrator account.
        </p>
        <button type="button" onClick={onExitSuperAdmin} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
          Back to Sunday School
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top SuperAdmin Navigation Header */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '0.85rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)',
              }}
            >
              <Crown size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: '#ffffff' }}>
                  SaaS Master Command
                </h1>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  SuperAdmin Portal
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Multi-Tenant Administration • Authenticated as <strong>{currentUser?.username || '@george.dev'}</strong>
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handleOpenStandaloneWindow}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              title="Open Admin Portal in a new standalone browser window"
            >
              <ExternalLink size={14} />
              <span className="hide-on-mobile">Open in New Window</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
              }}
              title="Refresh platform data"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>

            <button
              type="button"
              onClick={onExitSuperAdmin}
              className="btn btn-primary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
              }}
              title="Return to Sunday School Scoring application"
            >
              <School size={14} />
              <span>Sunday School App</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#f87171',
              }}
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '1.75rem 1.5rem', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Metric Cards Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
            gap: '1rem',
          }}
        >
          {/* Card 1: Total Classes */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Total Classes</span>
              <BookOpen size={18} color="#818cf8" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.35rem', color: '#ffffff', letterSpacing: '-0.5px' }}>
              {classes.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              SaaS Multi-Tenant Sunday Schools
            </div>
          </div>

          {/* Card 2: Active Classes */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                Active Classes
              </span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.35rem', color: '#a7f3d0', letterSpacing: '-0.5px' }}>
              {activeClassesCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '0.2rem' }}>
              Operational & Scoring Enabled
            </div>
          </div>

          {/* Card 3: Suspended Classes */}
          <div
            style={{
              background: suspendedClassesCount > 0
                ? 'linear-gradient(145deg, rgba(153, 27, 27, 0.45) 0%, rgba(15, 23, 42, 0.8) 100%)'
                : 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: suspendedClassesCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: suspendedClassesCount > 0 ? '#fca5a5' : '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Suspended Classes</span>
              <XCircle size={18} color={suspendedClassesCount > 0 ? '#ef4444' : '#64748b'} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.35rem', color: suspendedClassesCount > 0 ? '#f87171' : '#ffffff', letterSpacing: '-0.5px' }}>
              {suspendedClassesCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: suspendedClassesCount > 0 ? '#fca5a5' : '#64748b', marginTop: '0.2rem' }}>
              Locked out from login & scoring
            </div>
          </div>

          {/* Card 4: Total Servants */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Platform Servants</span>
              <Users size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.35rem', color: '#ffffff', letterSpacing: '-0.5px' }}>
              {users.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Servants & Class Admins
            </div>
          </div>

          {/* Card 5: Total Students */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Total Students</span>
              <School size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.35rem', color: '#ffffff', letterSpacing: '-0.5px' }}>
              {totalStudentsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Boys Enrolled Across Classes
            </div>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '0.5rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', paddingBottom: '0.35rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'classes' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'classes' ? 'white' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
            >
              <BookOpen size={16} />
              Classes Control ({classes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'users' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'users' ? 'white' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={16} />
              Platform Servants ({users.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'audit' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'audit' ? 'white' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={16} />
              Audit Logs ({auditLogs.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backups')}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'backups' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'backups' ? 'white' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Database size={16} />
              Daily Backups ({dailyBackups.length}/3)
            </button>
          </div>

          <div>
            {activeTab === 'classes' && (
              <button
                type="button"
                onClick={() => setIsCreateClassOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  padding: '0.5rem 0.85rem',
                }}
              >
                <Plus size={16} /> Create Class as SuperAdmin
              </button>
            )}

            {activeTab === 'users' && (
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  padding: '0.5rem 0.85rem',
                }}
              >
                <Plus size={16} /> Add Servant Account
              </button>
            )}

            {activeTab === 'backups' && (
              <button
                type="button"
                onClick={handleCreateBackupNow}
                disabled={creatingBackup}
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  padding: '0.5rem 0.85rem',
                }}
              >
                <RefreshCw size={16} className={creatingBackup ? 'spin' : ''} />
                <span>{creatingBackup ? 'Taking Snapshot...' : 'Create Daily Backup Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: CLASSES CONTROL */}
        {activeTab === 'classes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Filter bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search classes by name, username, or admin..."
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status:</span>
                <select
                  value={classStatusFilter}
                  onChange={(e) => setClassStatusFilter(e.target.value as any)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="ALL">All Classes ({classes.length})</option>
                  <option value="active">Active Only ({activeClassesCount})</option>
                  <option value="suspended">Suspended Only ({suspendedClassesCount})</option>
                </select>
              </div>
            </div>

            {/* Classes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1rem' }}>
              {filteredClasses.map((c) => {
                const isSuspended = c.status === 'suspended';
                const stats = classStats[c.id] || { studentsCount: 0, servantsCount: 0 };

                return (
                  <div
                    key={c.id}
                    style={{
                      background: isSuspended ? 'rgba(30, 20, 25, 0.7)' : 'rgba(15, 23, 42, 0.75)',
                      border: isSuspended ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div>
                      {/* Top Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                              {c.name}
                            </h3>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
                            @{c.username}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            background: isSuspended ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isSuspended ? '#f87171' : '#34d399',
                            border: isSuspended ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          {isSuspended ? (
                            <>
                              <XCircle size={11} /> Suspended
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={11} /> Active
                            </>
                          )}
                        </span>
                      </div>

                      {c.description && (
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
                          {c.description}
                        </p>
                      )}

                      {/* Info Pills */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.5rem',
                          margin: '0.85rem 0',
                          padding: '0.65rem',
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '8px',
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>STUDENTS</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{stats.studentsCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SERVANTS</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{stats.servantsCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ADMIN</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.adminUsername}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Created on {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {/* Inspect / Enter Class */}
                      <button
                        type="button"
                        onClick={() => onSelectClassToInspect(c)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          flex: 1,
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#60a5fa',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                        }}
                        title="Enter and inspect this class's roster and scoring"
                      >
                        <Eye size={13} /> Inspect
                      </button>

                      {/* Suspend / Reactivate Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSuspendClass(c)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          flex: 1,
                          background: isSuspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          border: isSuspended ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
                          color: isSuspended ? '#34d399' : '#facc15',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                        }}
                        title={isSuspended ? 'Reactivate class to allow logins' : 'Suspend class and block logins'}
                      >
                        {isSuspended ? (
                          <>
                            <CheckCircle2 size={13} /> Reactivate
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={13} /> Suspend
                          </>
                        )}
                      </button>

                      {/* Delete Class */}
                      <button
                        type="button"
                        onClick={() => handleDeleteClass(c)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '0.35rem 0.55rem',
                        }}
                        title="Permanently delete class and data"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PLATFORM USERS */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Filter bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search servants by name or @username..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Class:</span>
                <select
                  value={userClassFilter}
                  onChange={(e) => setUserClassFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (@{c.username})
                    </option>
                  ))}
                </select>

                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 6 }}>Role:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="superadmin">SuperAdmin</option>
                  <option value="admin">Class Admin</option>
                  <option value="servant">Servant</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Servant</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Username</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Assigned Class</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>SuperAdmin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isSuper = u.role === 'superadmin' || u.username === '@george.dev';
                      const assignedClass = classes.find((c) => c.id === u.classId);

                      return (
                        <tr
                          key={u.username}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            background: isSuper ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                          }}
                        >
                          {/* Name */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: isSuper ? '#7c3aed' : 'rgba(255, 255, 255, 0.08)',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  Joined {new Date(u.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Username */}
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>
                            {u.username}
                          </td>

                          {/* Class */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {assignedClass ? (
                              <div>
                                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{assignedClass.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#818cf8', fontFamily: 'monospace' }}>
                                  @{assignedClass.username}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Global (Platform)</span>
                            )}
                          </td>

                          {/* Role */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                background: isSuper ? 'rgba(124, 58, 237, 0.25)' : u.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                                color: isSuper ? '#c084fc' : u.role === 'admin' ? '#fbbf24' : '#60a5fa',
                                border: isSuper ? '1px solid rgba(124, 58, 237, 0.4)' : u.role === 'admin' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                              }}
                            >
                              {u.role}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: u.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : u.status === 'pending' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: u.status === 'approved' ? '#34d399' : u.status === 'pending' ? '#facc15' : '#f87171',
                              }}
                            >
                              {u.status || 'approved'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            {!isSuper ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                {/* Role toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserRole(u)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.25rem 0.5rem',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#e2e8f0',
                                  }}
                                  title={`Toggle role (currently ${u.role})`}
                                >
                                  Make {u.role === 'admin' ? 'Servant' : 'Admin'}
                                </button>

                                {/* Status toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.25rem 0.5rem',
                                    background: u.status === 'approved' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: u.status === 'approved' ? '#f87171' : '#34d399',
                                    border: 'none',
                                  }}
                                  title={u.status === 'approved' ? 'Decline / Reject Servant' : 'Approve Servant'}
                                >
                                  {u.status === 'approved' ? 'Reject' : 'Approve'}
                                </button>

                                {/* Delete User */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    padding: '0.25rem 0.45rem',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: 'none',
                                  }}
                                  title="Permanently delete account"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>
                                Master Account
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Global Audit Trail</h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total {auditLogs.length} events logged</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 600, overflowY: 'auto' }}>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: log.category === 'superadmin' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: log.category === 'superadmin' ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.1)',
                          color: '#e2e8f0',
                        }}
                      >
                        {log.action}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{log.servantName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{log.username}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 2 }}>{log.details}</div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DAILY BACKUPS (3-DAY ROLLING RETENTION & POINT-IN-TIME RESTORE) */}
        {activeTab === 'backups' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Banner with explanations and quick status */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', maxWidth: 800 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  <Database size={26} color="#ffffff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                      Automated Daily Backups & Point-in-Time Restore
                    </h2>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#6ee7b7',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}
                    >
                      3-Day Rolling Window
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    The system automatically captures a complete platform snapshot every day. Only up to 3 daily snapshots are retained (rolling window). Older backups beyond 3 days are purged automatically. SuperAdmin can restore the entire platform to any of these 3 points in time.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCreateBackupNow}
                  disabled={creatingBackup}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    fontWeight: 700,
                    padding: '0.7rem 1.25rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <RefreshCw size={16} className={creatingBackup ? 'spin' : ''} />
                  <span>{creatingBackup ? 'Capturing Snapshot...' : 'Create Backup Snapshot Now'}</span>
                </button>
              </div>
            </div>

            {/* Backups List / Cards */}
            {dailyBackups.length === 0 ? (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                }}
              >
                <Database size={40} color="#64748b" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.1rem', color: '#e2e8f0', margin: '0 0 0.5rem' }}>
                  No Daily Backups Stored Yet
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: 450, margin: '0 auto 1.5rem' }}>
                  The automated daily backup runs automatically every day, or you can capture a fresh platform snapshot right now.
                </p>
                <button
                  type="button"
                  onClick={handleCreateBackupNow}
                  disabled={creatingBackup}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
                >
                  Create First Daily Backup
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
                {dailyBackups.map((b, idx) => {
                  const isRestoringThis = restoringSnapshotId === b.id;
                  const backupDate = new Date(b.timestamp);
                  const isToday = b.date === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={b.id}
                      style={{
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                        border: isToday ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1.25rem',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top ribbon / status */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span
                            style={{
                              background: isToday ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                              border: isToday ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
                              color: isToday ? '#6ee7b7' : '#93c5fd',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: 20,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {isToday ? '🟢 Today’s Backup' : `Snapshot Slot #${idx + 1}`}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {backupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f8fafc' }}>
                          {b.label}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={13} />
                          <span>{b.date} • {backupDate.toLocaleDateString(undefined, { weekday: 'long' })}</span>
                        </div>

                        {/* Snapshot Metadata Stats */}
                        <div
                          style={{
                            marginTop: '1rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.75rem',
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '0.85rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Classes</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0', marginTop: 2 }}>
                              {b.totalClasses}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Students</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
                              {b.totalStudents}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Users / Servants</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                              {b.totalUsers}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Size (KB)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                              {b.dataSizeKb} KB
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                        <button
                          type="button"
                          onClick={() => setRestoreConfirmModal({ open: true, snapshot: b })}
                          disabled={isRestoringThis}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            fontWeight: 800,
                            padding: '0.65rem 1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          <RotateCcw size={16} className={isRestoringThis ? 'spin' : ''} />
                          <span>{isRestoringThis ? 'Restoring System...' : 'Restore to this Point'}</span>
                        </button>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadBackupJson(b)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              flex: 1,
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                            }}
                            title="Download raw JSON backup file"
                          >
                            <Download size={13} />
                            <span>Download JSON</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBackup(b)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              padding: '0.4rem 0.65rem',
                            }}
                            title="Delete this snapshot"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: CONFIRM RESTORE TO POINT IN TIME */}
      {restoreConfirmModal.open && restoreConfirmModal.snapshot && (
        <div className="modal-overlay" onClick={() => setRestoreConfirmModal({ open: false, snapshot: null })}>
          <div
            className="modal-content"
            style={{
              maxWidth: 520,
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.25)',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <h3 className="modal-title" style={{ color: '#ef4444' }}>
                  Point-in-Time System Restore
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRestoreConfirmModal({ open: false, snapshot: null })}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '1rem',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                <strong>⚠️ Warning:</strong> You are about to revert the platform to the snapshot taken on:
                <div style={{ fontWeight: 800, color: '#ffffff', marginTop: 4, fontSize: '0.95rem' }}>
                  {restoreConfirmModal.snapshot.date} ({new Date(restoreConfirmModal.snapshot.timestamp).toLocaleTimeString()})
                </div>
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#cbd5e1' }}>
                  This will restore: <strong>{restoreConfirmModal.snapshot.totalClasses} classes</strong>,{' '}
                  <strong>{restoreConfirmModal.snapshot.totalStudents} students</strong>, and all attendance/scoring data to this exact point.
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Any new registrations, check-ins, or changes made after this point in time will be overwritten by the snapshot. Are you sure you wish to proceed?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRestoreConfirmModal({ open: false, snapshot: null })}
                  className="btn btn-secondary"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={restoringSnapshotId !== null}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <RotateCcw size={16} className={restoringSnapshotId ? 'spin' : ''} />
                  <span>{restoringSnapshotId ? 'Restoring System...' : 'Confirm & Restore Platform'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CLASS */}
      {isCreateClassOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateClassOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 520, background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="modal-title" style={{ color: 'white' }}>Create Sunday School Class</h3>
              <button type="button" onClick={() => setIsCreateClassOpen(false)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateClass} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {createClassError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.5rem', borderRadius: 6, fontSize: '0.8rem' }}>
                  {createClassError}
                </div>
              )}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. George Grade 5"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="form-input"
                  style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Unique Class Username (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. stgeorge5"
                  value={newClassUsername}
                  onChange={(e) => setNewClassUsername(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''))}
                  className="form-input"
                  style={{ background: '#1e293b', color: 'white', borderColor: '#334155', fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Admin Servant Username</label>
                <input
                  type="text"
                  required
                  value={newClassAdmin}
                  onChange={(e) => setNewClassAdmin(e.target.value)}
                  className="form-input"
                  style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="form-input"
                  style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsCreateClassOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createClassLoading} className="btn btn-primary" style={{ background: '#10b981' }}>
                  {createClassLoading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {isCreateUserOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateUserOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 520, background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="modal-title" style={{ color: 'white' }}>Create Servant Account</h3>
              <button type="button" onClick={() => setIsCreateUserOpen(false)} className="btn btn-secondary btn-sm">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {createUserError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.5rem', borderRadius: 6, fontSize: '0.8rem' }}>
                  {createUserError}
                </div>
              )}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Servant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter servant full name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="form-input"
                  style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @servant.username"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="form-input"
                    style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="form-input"
                    style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Assign to Class</label>
                  <select
                    value={newUserClassId}
                    onChange={(e) => setNewUserClassId(e.target.value)}
                    className="form-input"
                    style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                  >
                    <option value="">Unassigned</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (@{c.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="form-input"
                    style={{ background: '#1e293b', color: 'white', borderColor: '#334155' }}
                  >
                    <option value="servant">Servant</option>
                    <option value="admin">Class Admin</option>
                    <option value="superadmin">SuperAdmin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsCreateUserOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#3b82f6' }}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
