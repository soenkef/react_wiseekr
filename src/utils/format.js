// src/utils/format.js - for converting issues isotime to localtime
export function formatFileSize(bytes) {
    if (bytes == null) return '–';
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }
  }

  // format.js (oder direkt in ScanDetailPage.js)
export function formatUtcDate(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleString('de-DE', {
    timeZone: 'UTC',
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit'
  });
}
  