/**
 * Lädt die CSV-/Scan-Datei (scan.filename) herunter.
 *
 * @param {{id: number, filename: string}} scan
 * @param {string} baseUrl  Basis‐URL deines Backends, z.B. '/api' oder 'http://192.168.178.148:5000/api'
 * @param {Function} flash  flash(message, variant)
 */
export async function handleDownload(scan, baseUrl, flash) {
  return handleDownloadFile(scan.id, scan.filename, baseUrl, flash);
}

/**
 * Lädt eine beliebige Datei (Handshake u.ä.) aus SCAN_FOLDER/<scanId>/file herunter.
 *
 * @param {number} scanId
 * @param {string} filename
 * @param {string} baseUrl
 * @param {Function} flash
 */
export async function handleDownloadFile(scanId, filename, baseUrl, flash) {
  try {
    // --------- WICHTIG: baue die URL exakt so auf ---------
    const url = `${baseUrl}/scans/${scanId}/file/${encodeURIComponent(filename)}`;
    console.log('📥 Download-URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return flash(err.error || 'Download fehlgeschlagen', 'danger');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);

  } catch (e) {
    console.error('Download-Fehler:', e);
    flash('Download fehlgeschlagen', 'danger');
  }
}


/**
 * Lädt alle Dateien eines Scans als ZIP-Archiv herunter.
 *
 * @param {{id:number}} scan
 * @param {string} baseUrl
 * @param {Function} flash
 */
export async function handleDownloadAll(scan, baseUrl, flash) {
  try {
    const url = `${baseUrl}/scans/${scan.id}/download_all`;
    console.log('ZIP-Download URL:', url);
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return flash(err.error || 'Download fehlgeschlagen', 'danger');
    }
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `scan_${scan.id}_all_files.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    console.error('Download-All-Fehler:', e);
    flash('Download fehlgeschlagen', 'danger');
  }
}