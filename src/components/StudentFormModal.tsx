import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Calendar,
  MapPin,
  School,
  Phone,
  Heart,
  ShieldAlert,
  Sparkles,
  FileText,
  Camera,
  Church,
  Download,
  Wand2,
  RefreshCw
} from 'lucide-react';
import type { Student, LoveLanguage } from '../types';
import { calculateAge, getTodayDateString } from '../utils/helpers';
import {
  generateStudentId,
  parseFullName,
  getInitialLetter,
  generateQRCodeDataURL,
  downloadSingleStudentQR
} from '../utils/qr';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  initialQrCode?: string;
  existingStudent?: Student | null;
  existingStudents?: Student[];
  className?: string;
}

const LOVE_LANGUAGES: LoveLanguage[] = [
  'Words of Affirmation',
  'Quality Time',
  'Receiving Gifts',
  'Acts of Service',
  'Physical Touch',
  'Other / Not determined',
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQrCode = '',
  existingStudent = null,
  existingStudents = [],
  className = 'Pope Saweros Class',
}) => {
  const [formData, setFormData] = useState<Student>({
    id: '',
    series: '',
    name: '',
    arabicName: '',
    dob: '2016-01-01',
    address: '',
    school: '',
    category: className,
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Words of Affirmation',
    weakPoints: '',
    hobbies: '',
    notes: '',
    confessionFather: '',
    confessionMonthlyDay: 15,
    photoUrl: '',
    isDeacon: false,
    createdAt: new Date().toISOString(),
  });

  const [manuallyEditedId, setManuallyEditedId] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [isDownloadingQR, setIsDownloadingQR] = useState(false);

  useEffect(() => {
    if (existingStudent) {
      setFormData(existingStudent);
      setManuallyEditedId(true);
    } else {
      setFormData({
        id: initialQrCode || '',
        series: '',
        name: '',
        arabicName: '',
        dob: '2016-01-01',
        address: '',
        school: '',
        category: className,
        boyPhone: '',
        dadPhone: '',
        momPhone: '',
        loveLanguage: 'Words of Affirmation',
        weakPoints: '',
        hobbies: '',
        notes: '',
        confessionFather: '',
        confessionMonthlyDay: 15,
        photoUrl: '',
        isDeacon: false,
        createdAt: new Date().toISOString(),
      });
      setManuallyEditedId(!!initialQrCode);
    }
  }, [existingStudent, initialQrCode, isOpen, className]);

  // Generate QR preview when ID changes
  useEffect(() => {
    if (formData.id.trim()) {
      generateQRCodeDataURL(formData.id.trim())
        .then((url) => setQrPreviewUrl(url))
        .catch(() => setQrPreviewUrl(''));
    } else {
      setQrPreviewUrl('');
    }
  }, [formData.id]);

  const handleChange = <K extends keyof Student>(field: K, value: Student[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // If user hasn't manually edited the ID and we are registering a new boy:
      // Auto-compute ID from Boy + Dad + Grandpa name initials
      if (!existingStudent && !manuallyEditedId && (field === 'name' || field === 'arabicName' || field === 'dob')) {
        const parsed = parseFullName(next.name || next.arabicName || '');
        if (parsed.boyName) {
          const otherIds = existingStudents.map((s) => s.id);
          const autoId = generateStudentId(parsed.boyName, parsed.dadName, parsed.grandpaName, next.dob, otherIds);
          next.id = autoId;
        }
      }

      return next;
    });
  };

  const handleAutoGenerateId = () => {
    const parsed = parseFullName(formData.name || formData.arabicName || '');
    if (!parsed.boyName) {
      alert('Please enter at least the student’s name first.');
      return;
    }
    const otherIds = existingStudents.filter((s) => s.id !== existingStudent?.id).map((s) => s.id);
    const autoId = generateStudentId(parsed.boyName, parsed.dadName, parsed.grandpaName, formData.dob, otherIds);
    setFormData((prev) => ({ ...prev, id: autoId }));
    setManuallyEditedId(false);
  };

  const handleDownloadQR = async () => {
    if (!formData.name.trim() || !formData.id.trim()) {
      alert('Please provide student name and ID before downloading the QR code.');
      return;
    }
    setIsDownloadingQR(true);
    try {
      await downloadSingleStudentQR(formData, className);
    } catch {
      alert('Failed to download QR code.');
    } finally {
      setIsDownloadingQR(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          handleChange('photoUrl', ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter the student’s name.');
      return;
    }
    if (!formData.id.trim()) {
      alert('Please provide a Student ID.');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const calculatedAge = calculateAge(formData.dob);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 680, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={18} color="var(--color-primary)" />
            </div>
            <div>
              <h3 className="modal-title">
                {existingStudent ? 'Edit Student Profile' : 'Register New Student'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {existingStudent
                  ? 'Update pastoral care records and contact data'
                  : 'Assign passport QR code & register boy'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top Helper */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              {existingStudent
                ? `Updating profile for ${existingStudent.name} (${existingStudent.id})`
                : 'Assign unique Student ID & register boy'}
            </div>

            {/* Passport QR Badge, Auto-ID & Preview */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
                border: '1px solid #bfdbfe',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                {/* ID Input & Auto-ID Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a' }}>
                    Student ID *:
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Auto-generated ID"
                    value={formData.id}
                    onChange={(e) => {
                      setManuallyEditedId(true);
                      handleChange('id', e.target.value.toUpperCase());
                    }}
                    className="form-input"
                    style={{
                      width: '130px',
                      padding: '0.3rem 0.55rem',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      background: 'white',
                      border: '1.5px solid #3b82f6',
                      color: '#1e40af',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateId}
                    className="btn btn-secondary btn-sm"
                    title="Auto-generate ID from initials (Boy + Dad + Grandpa) & DOB"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#2563eb',
                      background: 'white',
                      border: '1px solid #93c5fd',
                    }}
                  >
                    <Wand2 size={13} />
                    Auto-ID
                  </button>
                </div>

                {/* Series Code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Series:
                  </span>
                  <input
                    type="text"
                    placeholder="Auto-Series"
                    value={formData.series || ''}
                    onChange={(e) => handleChange('series', e.target.value)}
                    className="form-input"
                    style={{
                      width: '120px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      background: 'white',
                    }}
                  />
                </div>

                {/* Class Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#1e3a8a' }}>
                  <strong>Class:</strong> {className}
                </div>
              </div>

              {/* Initials Formula & Live QR Preview Strip */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed #cbd5e1',
                }}
              >
                {/* Initials breakdown pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600 }}>Formula:</span>
                  {(() => {
                    const parsed = parseFullName(formData.name || formData.arabicName || '');
                    const b = getInitialLetter(parsed.boyName) || '?';
                    const d = getInitialLetter(parsed.dadName) || '?';
                    const g = getInitialLetter(parsed.grandpaName) || '?';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                          Boy [{b}]
                        </span>
                        <span>+</span>
                        <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                          Dad [{d}]
                        </span>
                        <span>+</span>
                        <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                          Grandpa [{g}]
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Live QR Code Mini Preview & Download Button */}
                {formData.id.trim() && qrPreviewUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'white',
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <img src={qrPreviewUrl} alt="QR Code Preview" style={{ width: 44, height: 44, display: 'block' }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1e293b', letterSpacing: '0.5px' }}>
                        ID: {formData.id}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      disabled={isDownloadingQR}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.65rem',
                        background: '#ffffff',
                        border: '1px solid #3b82f6',
                        color: '#1d4ed8',
                        fontWeight: 600,
                      }}
                    >
                      {isDownloadingQR ? (
                        <>
                          <RefreshCw size={13} className="spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Download size={13} /> Download QR Badge
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Name Fields: English & Arabic */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} /> Full Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter boy's full English name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} /> الاسم بالعربي (Arabic Name)
                </label>
                <input
                  type="text"
                  placeholder="اسم المخدوم باللغة العربية"
                  value={formData.arabicName || ''}
                  onChange={(e) => handleChange('arabicName', e.target.value)}
                  className="form-input"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Date of Birth & Deacon (شماس) Checkbox */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} /> Date of Birth {calculatedAge > 0 ? `(${calculatedAge} years old)` : ''}
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  max={getTodayDateString()}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Shamas Checkbox */}
              <div className="form-group" style={{ justifyContent: 'center' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Church size={14} /> رتبة الشماسية (Deacon)
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.85rem',
                    background: formData.isDeacon ? '#f5f3ff' : 'var(--bg-subtle)',
                    border: formData.isDeacon ? '1.5px solid #8b5cf6' : '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isDeacon || false}
                    onChange={(e) => handleChange('isDeacon', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: formData.isDeacon ? '#6d28d9' : 'var(--text-primary)' }}>
                    ✝️ شماس (Deacon)
                  </span>
                  {formData.isDeacon && (
                    <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, marginLeft: 'auto' }}>
                      مشرطن / خادم مذبح
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* School & Address */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <School size={14} /> School & Grade
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Joseph Language School, 5th Primary"
                  value={formData.school}
                  onChange={(e) => handleChange('school', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> Home Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14 Al-Horreya St., Heliopolis"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Phone Numbers: Boy, Dad, Mom */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} color="var(--color-primary)" /> Boy's Own Phone (موبايل الولد) - Optional
              </label>
              <input
                type="tel"
                placeholder="e.g. 01211223344"
                value={formData.boyPhone || ''}
                onChange={(e) => handleChange('boyPhone', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} /> Dad's Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 01223456789"
                  value={formData.dadPhone}
                  onChange={(e) => handleChange('dadPhone', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} /> Mom's Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 01012345678"
                  value={formData.momPhone}
                  onChange={(e) => handleChange('momPhone', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Spiritual Care: Confession Father & Monthly Confession Day */}
            <div className="form-grid-2" style={{ background: '#fdf4ff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f0abfc', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#86198f', fontWeight: 700 }}>
                  <Church size={14} color="#a21caf" /> أب الاعتراف (Father of Confession)
                </label>
                <input
                  type="text"
                  list="priests-list"
                  placeholder="e.g. أبونا بولا / أبونا تادرس"
                  value={formData.confessionFather || ''}
                  onChange={(e) => handleChange('confessionFather', e.target.value)}
                  className="form-input"
                  style={{ background: 'white' }}
                />
                <datalist id="priests-list">
                  <option value="أبونا بولا" />
                  <option value="أبونا تادرس" />
                  <option value="أبونا لوقا" />
                  <option value="أبونا يوحنا" />
                  <option value="أبونا مينا" />
                </datalist>
                <span style={{ fontSize: '0.72rem', color: '#a21caf', marginTop: '2px', display: 'block' }}>
                  كاهن الاعتراف الخاص بالولد للمتابعة الروحية
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#86198f', fontWeight: 700 }}>
                  <Calendar size={14} color="#a21caf" /> يوم الاعتراف الشهري (Monthly Day)
                </label>
                <select
                  value={formData.confessionMonthlyDay || 15}
                  onChange={(e) => handleChange('confessionMonthlyDay', Number(e.target.value))}
                  className="form-select"
                  style={{ background: 'white' }}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      يوم {day} من كل شهر (Day {day} of month)
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#a21caf', marginTop: '2px', display: 'block' }}>
                  اليوم المحدد شهرياً للاعتراف واحتساب النقاط
                </span>
              </div>
            </div>

            {/* Love Language */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Heart size={14} color="var(--color-danger)" /> Love Language (لغة الحب الأساسية)
              </label>
              <select
                value={formData.loveLanguage}
                onChange={(e) => handleChange('loveLanguage', e.target.value as LoveLanguage)}
                className="form-select"
              >
                {LOVE_LANGUAGES.map((ll) => (
                  <option key={ll} value={ll}>
                    {ll}
                  </option>
                ))}
              </select>
            </div>

            {/* Weak Points & Hobbies */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldAlert size={14} color="var(--color-warning)" /> Weak Points & Pastoral Care (نقاط الضعف والمتابعة)
                </label>
                <textarea
                  rows={2}
                  placeholder="Behavioral or spiritual struggles needing prayer and servant guidance..."
                  value={formData.weakPoints}
                  onChange={(e) => handleChange('weakPoints', e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={14} color="var(--color-accent)" /> Hobbies & Talents (الهوايات والمواهب)
                </label>
                <textarea
                  rows={2}
                  placeholder="Sports, musical instruments, hymns, drawing, reading..."
                  value={formData.hobbies}
                  onChange={(e) => handleChange('hobbies', e.target.value)}
                  className="form-textarea"
                />
              </div>
            </div>

            {/* General Servant Notes */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} /> General Servant Notes (ملاحظات الخدام)
              </label>
              <textarea
                rows={2}
                placeholder="Family background, spiritual milestones, confession father, etc."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="form-textarea"
              />
            </div>

            {/* Profile Picture Option */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Camera size={14} /> Profile Picture (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {formData.photoUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={formData.photoUrl}
                      alt="Student"
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 'var(--radius-full)',
                        objectFit: 'cover',
                        border: '1px solid var(--border-medium)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('photoUrl', '')}
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : null}
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  Choose Photo File
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
