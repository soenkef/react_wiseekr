// src/pages/ScanDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Body from '../components/Body';
import Button from 'react-bootstrap/Button';
import ScanHeader from '../components/ScanHeader';
import AccessPoints from '../components/AccessPoints';
import UnlinkedClients from '../components/UnlinkedClients';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';
import { handleDownload } from '../utils/download';

export default function ScanDetailPage() {
  const { id } = useParams();
  const scanId = parseInt(id, 10);
  const navigate = useNavigate();
  const api = useApi();
  const flash = useFlash();

  const [scan, setScan] = useState(null);

  // Editierfunktion, um Scan-Daten zu aktualisieren
  const updateScan = async (data) => {
    const resp = await api.put(`/scans/${scanId}`, data);
    if (resp.ok) {
      setScan(prev => ({ ...prev, ...resp.body }));
      flash('Scan aktualisiert', 'success');
    } else {
      flash(resp.body?.error || 'Aktualisierung fehlgeschlagen', 'danger');
    }
  };

  // Hilfsfunktion, um Scan-Daten neu einzulesen
  const reloadScan = async () => {
    const resp = await api.get(`/scans/${scanId}`);
    if (resp.ok) setScan(resp.body);
    else flash(resp.body?.error || 'Scan nicht gefunden', 'danger');
  };

  useEffect(() => {
    const load = async () => {
      const resp = await api.get(`/scans/${scanId}`);
      if (resp.ok) setScan(resp.body);
      else flash(resp.body?.error || 'Scan nicht gefunden', 'danger');
    };
    if (scanId) load();
  }, [scanId, api, flash]);

  if (!scan) return <Body><p>Lade Scan-Daten...</p></Body>;

  return (
    <Body>
      <Button variant="primary" className="mb-3" onClick={() => navigate('/scans')}>
        Übersicht
      </Button>
      <ScanHeader
        scan={scan}
        onDownload={() => handleDownload(scan, api.base_url, flash)}
        onUpdate={updateScan}
      />
      <AccessPoints scan={scan} onRescanComplete={reloadScan} />
      <hr />
      <UnlinkedClients scan={scan} />
    </Body>
  );
}