export const handleDownload = async (scan, flash) => {
    try {
      const response = await fetch(`/api/scans/${scan.id}/download`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        flash(err.error || 'Download fehlgeschlagen', 'danger');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = scan.filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      flash('Download fehlgeschlagen', 'danger');
    }
  };

  
/**
 * Lädt eine beliebige Datei vom Backend herunter (Handshake etc.).
 *
 * @param {string} filename – Name der Datei (z.B. handshake.cap)
 * @param {string} baseUrl  – base_url aus deinem ApiProvider (z.B. '/api')
 * @param {Function} flash  – flash(message, variant)
 */
export const handleDownloadFile = async (filename, baseUrl, flash) => {
  try {
    const url = `${baseUrl}/scans/file/${encodeURIComponent(filename)}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      flash(err.error || 'Download fehlgeschlagen', 'danger');
      return;
    }
    const blob = await response.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch (e) {
    console.error('Download-Fehler:', e);
    flash('Download fehlgeschlagen', 'danger');
  }
};