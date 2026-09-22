import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, MapPin, School, Phone, Heart, ShieldAlert, Sparkles, FileText, Camera } from 'lucide-react';
import type { Student, LoveLanguage } from '../types';
import { calculateAge, getTodayDateString } from '../utils/helpers';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  initialQrCode?: string;
  existingStudent?: Student | null;
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
}) => {
  const [formData, setFormData] = useState<Student>({
    id: '',
    name: '',
    dob: '2015-01-01',
    address: '',
    school: '',
    category: 'Grade 4',
    boyPhone: '',
    dadPhone: '',
    momPhone: '',
    loveLanguage: 'Words of Affirmation',
    weakPoints: '',
    hobbies: '',
    notes: '',
    photoUrl: '',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    if (existingStudent) {
      setFormData(existingStudent);
    } else {
      setFormData({
        id: initialQrCode || `PASSPORT-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        dob: '2015-01-01',
        address: '',
        school: '',
        category: 'Grade 4',
        boyPhone: '',
        dadPhone: '',
        momPhone: '',
        loveLanguage: 'Words of Affirmation',
        weakPoints: '',
        hobbies: '',
        notes: '',
        photoUrl: '',
        createdAt: new Date().toISOString(),
      });
    }
  }, [existingStudent, initialQrCode, isOpen]);

  const handleChange = (field: keyof Student, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      alert('Please provide a Passport QR ID.');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const calculatedAge = calculateAge(formData.dob);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                {existingStudent ? 'Edit Student Profile' : 'New Kid Registration'}
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
            {/* Passport QR Badge & Category */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Passport QR Code:
                </span>
                <input
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) => handleChange('id', e.target.value)}
                  className="form-input"
                  style={{
                    width: '160px',
                    padding: '0.25rem 0.5rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    background: 'white',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Class:</strong> Pope Saweros (Grade 4)
              </div>
            </div>

            {/* Basic Info */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Mina Youssef"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="form-input"
                />
              </div>

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
