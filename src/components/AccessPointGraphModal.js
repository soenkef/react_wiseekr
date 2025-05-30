import React, { useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf'; 

export default function AccessPointFlowModal({ show, onHide, ap }) {
  const flowRef = useRef();

  const handleDownload = async (format = 'png') => {
    const canvas = await html2canvas(flowRef.current, {
      backgroundColor: '#fff',
      scale: 2
    });

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      const width = pageWidth - 20;
      const height = width / ratio;

      pdf.addImage(imgData, 'PNG', 10, 10, width, height);
      pdf.save(`AP-${ap.essid || ap.bssid}.pdf`);
    } else {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `AP-${ap.essid || ap.bssid}.png`;
      link.click();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Visualisierung: {ap.essid || '<Hidden>'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div ref={flowRef} className="p-4 bg-white border rounded">
          <div className="text-center mb-4">
            <h5 className="fw-bold mb-1">{ap.essid || '<Hidden>'}</h5>
            <div className="text-muted small">{ap.bssid}</div>
            <div className="text-muted small">
              Channel {ap.channel} | Power {ap.power} dBm | Clients: {ap.clients.length}
            </div>
            {ap.cracked_password && (
              <div className="mt-2 text-success"><strong>🔓 Passwort:</strong> {ap.cracked_password}</div>
            )}
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-3">
            {ap.clients.length === 0 ? (
              <em className="text-muted">Keine Clients verbunden</em>
            ) : (
              ap.clients.map((c) => (
                <Card key={c.mac} style={{ width: '12rem' }} className="text-center shadow-sm border">
                  <Card.Body>
                    <Card.Subtitle className="mb-2 text-muted text-monospace">{c.mac}</Card.Subtitle>
                    <div className="small text-muted mb-2">{c.vendor || '–'}</div>
                    <div className="small">Power: {c.power ?? '–'} dBm</div>
                    <div className="small">First: {new Date(c.first_seen).toLocaleString()}</div>
                    <div className="small">Last: {new Date(c.last_seen).toLocaleString()}</div>
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => handleDownload('png')}>PNG herunterladen</Button>
        <Button variant="primary" onClick={() => handleDownload('pdf')}>PDF herunterladen</Button>
        <Button variant="outline-secondary" onClick={onHide}>Schließen</Button>
      </Modal.Footer>
    </Modal>
  );
}
