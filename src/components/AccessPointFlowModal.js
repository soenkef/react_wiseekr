import React, { useRef, useMemo } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './AccessPointFlowModal.css';

export default function AccessPointFlowModal({ show, onHide, ap }) {
  // Dedupe clients by MAC and merge probed_essids
  const uniqueClients = useMemo(() => {
    const map = new Map();
    (ap.clients || []).forEach(c => {
      if (!map.has(c.mac)) {
        map.set(c.mac, {
          ...c,
          probed_essids: Array.isArray(c.probed_essids) ? c.probed_essids : (c.probed_essids ? [c.probed_essids] : [])
        });
      } else {
        const existing = map.get(c.mac);
        // update last_seen
        if (new Date(c.last_seen) > new Date(existing.last_seen)) existing.last_seen = c.last_seen;
        // vendor
        if (!existing.vendor && c.vendor) existing.vendor = c.vendor;
        // merge probed_essids
        const merged = new Set([...(existing.probed_essids || []), ...(Array.isArray(c.probed_essids) ? c.probed_essids : [c.probed_essids])]);
        existing.probed_essids = Array.from(merged);
      }
    });
    return Array.from(map.values());
  }, [ap.clients]);

  const containerRef = useRef();

  const handleDownloadPDF = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const width = canvas.width * ratio;
    const height = canvas.height * ratio;
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;
    pdf.addImage(imgData, 'PNG', x, y, width, height);
    pdf.save(`${ap.essid || ap.bssid}_diagramm.pdf`);
  };

  const handleDownloadPNG = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `${ap.essid || ap.bssid}_diagramm.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const chunkClients = (clients, chunkSize = 5) => {
    const result = [];
    for (let i = 0; i < clients.length; i += chunkSize) {
      result.push(clients.slice(i, i + chunkSize));
    }
    return result;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Diagramm: {ap.essid || ap.bssid}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div ref={containerRef} className="flow-container">
          <div className="access-point-box">
            <div className="ap-title">{ap.essid || '<Hidden>'}</div>
            <div className="ap-details">
              <div><strong>BSSID:</strong> {ap.bssid} | <strong>Vendor:</strong> {ap.vendor || '–'}</div>
              <div className="ap-stats-row">
                <strong>Channel:</strong> {ap.channel} &nbsp;|&nbsp;
                <strong>Power:</strong> {ap.power ?? '–'} dBm &nbsp;|&nbsp;
                <strong>Privacy:</strong> {ap.privacy || '–'} &nbsp;|&nbsp;
                <strong>Clients:</strong> {uniqueClients.length}
              </div>
              {ap.cracked_password && (
                <div className="ap-stats-row">
                  <strong>Passwort:</strong> {ap.cracked_password}
                </div>
              )}
            </div>
          </div>

          <div className="clients-grid-multicolumn">
            {chunkClients(uniqueClients).map((column, colIndex) => (
              <div key={colIndex} className="clients-column">
                {column.map(client => (
                  <div key={client.mac} className="client-box">
                    <div className="client-mac">{client.mac}</div>
                    <div className="client-vendor">{client.vendor || '–'}</div>
                    <div className="client-power">Power: {client.power ?? '–'} dBm</div>
                    <div className="client-packets">Packets: {client.packets ?? '–'}</div>
                    {client.is_camera && (
                      <div className="client-camera">📷 Überwachungsgerät erkannt</div>
                    )}
                    {client.probed_essids && client.probed_essids.length > 0 && (
                      <div className="client-probed">
                        {client.probed_essids.map((essid, i) => (
                          <div key={i} className="client-probed-essid">{essid}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="footer">
            <div className="footer-meta">
              <div><strong>Scan-Zeit:</strong> {ap.last_seen ? new Date(ap.last_seen).toLocaleString(undefined, { timeZone: 'UTC' }) : '–'}</div>
              <div><strong>Beschreibung:</strong> {ap.description || '–'}</div>
              <div><strong>Ort:</strong> {ap.location || '–'}</div>
            </div>
            <div className="branding">WISEEKR</div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Schließen</Button>
        <Button variant="outline-primary" onClick={handleDownloadPNG}>Als PNG herunterladen</Button>
        <Button variant="primary" onClick={handleDownloadPDF}>Als PDF herunterladen</Button>
      </Modal.Footer>
    </Modal>
  );
}
