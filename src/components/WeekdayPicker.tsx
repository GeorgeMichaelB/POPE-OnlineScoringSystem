import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatFriendlyDate } from '../utils/helpers';

interface WeekdayPickerProps {
  label: string;
  selectedDate: string;
  availableDates: string[]; // List of Fridays only or Saturdays only
  onChangeDate: (date: string) => void;
  currentDefaultDate: string;
}

export const WeekdayPicker: React.FC<WeekdayPickerProps> = ({
  label,
  selectedDate,
  availableDates,
  onChangeDate,
  currentDefaultDate,
}) => {
  const currentIndex = availableDates.indexOf(selectedDate);

  const handlePrev = () => {
    // In our reverse array, older dates are at higher indexes
    if (currentIndex < availableDates.length - 1) {
      onChangeDate(availableDates[currentIndex + 1]);
    }
  };

  const handleNext = () => {
    // Newer dates are at lower indexes
    if (currentIndex > 0) {
      onChangeDate(availableDates[currentIndex - 1]);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <Calendar size={18} color="var(--text-secondary)" />
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex >= availableDates.length - 1}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.55rem' }}
            title="Previous Week"
          >
            <ChevronLeft size={15} />
          </button>

          <select
            value={selectedDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="form-select"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              minWidth: '185px',
            }}
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {formatFriendlyDate(date)} {date === currentDefaultDate ? ' (Current)' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex <= 0}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.55rem' }}
            title="Next Week"
          >
            <ChevronRight size={15} />
          </button>

          {selectedDate !== currentDefaultDate && (
            <button
              type="button"
              onClick={() => onChangeDate(currentDefaultDate)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            >
              Current
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
