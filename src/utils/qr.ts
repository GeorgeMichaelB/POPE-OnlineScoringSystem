import QRCode from 'qrcode';
import JSZip from 'jszip';
import type { Student } from '../types';

// Arabic to Latin transliteration map for generating initials
const ARABIC_INITIAL_MAP: Record<string, string> = {
  'ا': 'A', 'أ': 'A', 'إ': 'I', 'آ': 'A', 'ء': 'A', 'ع': 'A',
  'ب': 'B',
  'ت': 'T', 'ط': 'T',
  'ث': 'S', 'س': 'S', 'ص': 'S',
  'ج': 'G',
  'ح': 'H', 'خ': 'K', 'ه': 'H',
  'د': 'D', 'ض': 'D',
  'ذ': 'Z', 'ز': 'Z', 'ظ': 'Z',
  'ر': 'R',
  'ش': 'S',
  'ف': 'F',
  'ق': 'K', 'ك': 'K',
  'ل': 'L',
  'م': 'M',
  'ن': 'N',
  'و': 'W',
  'ي': 'Y', 'ى': 'Y',
};

/**
 * Extracts the single initial letter in uppercase English/Latin.
 */
export function getInitialLetter(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const firstChar = trimmed.charAt(0);

  // Check Arabic character
  if (ARABIC_INITIAL_MAP[firstChar]) {
    return ARABIC_INITIAL_MAP[firstChar];
  }

  // Latin/English character
  const upper = firstChar.toUpperCase();
  if (/^[A-Z]$/.test(upper)) {
    return upper;
  }

  return 'X';
}

/**
 * Parses full name into Boy Name, Dad Name, and Grandpa Name.
 */
export function parseFullName(fullName: string): {
  boyName: string;
  dadName: string;
  grandpaName: string;
} {
  if (!fullName) return { boyName: '', dadName: '', grandpaName: '' };
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const boyName = parts[0] || '';
  const dadName = parts[1] || '';
  const grandpaName = parts[2] || (parts.length > 3 ? parts[parts.length - 1] : '');
  return { boyName, dadName, grandpaName };
}

/**
 * Auto-creates a unique Student ID based on:
 * - First letter of boy's name
 * - First letter of dad's name
 * - First letter of grandpa's name
 * + DOB Month-Day or unique sequential suffix (e.g. AWI1012 or MMS01)
 */
export function generateStudentId(
  boyName: string,
  dadName: string,
  grandpaName: string,
  dob?: string,
  existingIds: string[] = []
): string {
  const b = getInitialLetter(boyName) || 'X';
  const d = getInitialLetter(dadName) || 'X';
  const g = getInitialLetter(grandpaName) || 'X';
  const prefix = `${b}${d}${g}`.toUpperCase();

  // If DOB provided (YYYY-MM-DD), extract MMDD (e.g. 2016-10-12 -> 1012)
  let baseSuffix = '';
  if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const [, month, day] = dob.split('-');
    baseSuffix = `${month}${day}`;
  }

  const existingSet = new Set(existingIds.map((id) => id.trim().toUpperCase()));

  if (baseSuffix) {
    const candidate = `${prefix}${baseSuffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // If collision or no DOB, find next available sequence 01, 02, etc.
  for (let seq = 1; seq <= 999; seq++) {
    const numStr = seq < 10 ? `0${seq}` : `${seq}`;
    const candidate = `${prefix}${numStr}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  return `${prefix}${Date.now().toString().slice(-4)}`;
}

/**
 * Generates QR Code Data URL string (PNG)
 */
export async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 320,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Sanitizes student name for safe file naming (e.g. "Andy Wael Ibrahim" -> "Andy_Wael_Ibrahim")
 */
export function sanitizeFileName(name: string): string {
  const clean = name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '_');
  return clean || 'Student';
}

/**
 * Renders a high-resolution Church Passport Badge Canvas with QR Code and prominent ID text.
 */
export async function renderStudentPassportCard(
  student: Student,
  className = 'Pope Saweros Class'
): Promise<HTMLCanvasElement> {
  const width = 600;
  const height = 760;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Background gradient: Dark Church Navy
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e293b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Gold / Accent Border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // Inner Subtle Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Header Banner
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fillRect(20, 20, width - 40, 80);

  // Cross Icon & Class Title
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✝️ SUNDAY SCHOOL PASSPORT', width / 2, 54);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(className.toUpperCase(), width / 2, 82);

  // Student Full Name (English)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(student.name, width / 2, 138);

  // Student Arabic Name (if present)
  let qrCenterY = 320;
  if (student.arabicName) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(student.arabicName, width / 2, 168);
    qrCenterY = 340;
  }

  // Draw QR Code onto Canvas
  const qrDataUrl = await generateQRCodeDataURL(student.id);
  const qrImage = await loadImage(qrDataUrl);

  const qrSize = 250;
  const qrX = (width - qrSize) / 2;
  const qrY = qrCenterY - qrSize / 2;

  // QR Container Background (White Card)
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 16);
  ctx.fill();

  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // STUDENT ID TEXT (Large, Bold, High-Contrast right below QR code)
  const idBoxY = qrY + qrSize + 28;

  // ID Pill Badge
  ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
  roundRect(ctx, 60, idBoxY, width - 120, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  roundRect(ctx, 60, idBoxY, width - 120, 56, 12);
  ctx.stroke();

  // ID Text Label
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 24px monospace, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ID: ${student.id}`, width / 2, idBoxY + 36);

  // Extra Details: Series & DOB
  let metaY = idBoxY + 84;
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 14px system-ui, sans-serif';

  const details: string[] = [];
  if (student.series) details.push(`Series: ${student.series}`);
  if (student.dob) details.push(`DOB: ${student.dob}`);
  if (student.isDeacon) details.push('✝️ Deacon (شماس)');

  if (details.length > 0) {
    ctx.fillText(details.join('  •  '), width / 2, metaY);
  }

  // Footer Instructions
  ctx.fillStyle = '#64748b';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Official Church Pass • Scan for Attendance & Points', width / 2, height - 36);

  return canvas;
}

/**
 * Downloads a single student QR card named after the boy's name.
 */
export async function downloadSingleStudentQR(student: Student, className?: string): Promise<void> {
  const canvas = await renderStudentPassportCard(student, className);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to create QR image blob');

  const fileName = `${sanitizeFileName(student.name)}_QR.png`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/**
 * Downloads ALL student QR codes as a ZIP file, with each image named after the boy's name.
 */
export async function downloadAllStudentsQRZip(
  students: Student[],
  className = 'Pope Saweros Class',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (students.length === 0) {
    alert('No students to export.');
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder(`${sanitizeFileName(className)}_QR_Codes`) || zip;
  const nameCounts: Record<string, number> = {};

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (onProgress) {
      onProgress(i + 1, students.length);
    }

    const canvas = await renderStudentPassportCard(student, className);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const baseName = sanitizeFileName(student.name);
      // Disambiguate if two boys share the exact same name
      nameCounts[baseName] = (nameCounts[baseName] || 0) + 1;
      const fileName =
        nameCounts[baseName] > 1
          ? `${baseName}_${student.id}.png`
          : `${baseName}.png`;

      folder.file(fileName, blob);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `${sanitizeFileName(className)}_All_QR_Codes.zip`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

// Helper to load image for canvas
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

// Helper to draw rounded rectangle on canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
