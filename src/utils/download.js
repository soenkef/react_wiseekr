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