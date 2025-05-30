// src/pages/ScanDetailPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Body from '../components/Body';
import Button from 'react-bootstrap/Button';
import ScanHeader from '../components/ScanHeader';
import AccessPoints from '../components/AccessPoints';
import UnlinkedClients from '../components/UnlinkedClients';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';
import { handleDownload } from '../utils/download';
import { useScanLoop } from '../contexts/ScanLoopProvider';
import Alert from 'react-bootstrap/Alert';


export default function ScanDetailPage() {
  const { id } = useParams();
  const scanId = parseInt(id, 10);
  const navigate = useNavigate();
  const api = useApi();
  const flash = useFlash();

  const [scan, setScan] = useState(null);

  const { loopingRef, scanIdRef } = useScanLoop();
  const [loopingAp, setLoopingAp] = useState(null);
  const loopingRefAp = useRef(false);


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

  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/scans/${scanId}`).then(resp => {
        if (resp.ok) {
          setScan(resp.body); // oder setAccessPoints, etc.
        }
      });
    }, 10000); // alle 10 Sekunden

    return () => clearInterval(interval);
  }, [scanId, api]);

  const stopLoopScanAp = () => {
    loopingRefAp.current = false;
    setLoopingAp(null);
    flash('AP-Scan wird gestoppt. Bitte diese Seite noch für ca. 90 Sekunden geöffnet lassen.', 'warning');
  };

  const startLoopScanAp = async (bssid, duration = 90) => {
    setLoopingAp(bssid);
    loopingRefAp.current = true;

    const loop = async () => {
      if (!loopingRefAp.current) return;
      try {
        await api.post(`/scans/${scan.id}/scan_ap`, { bssid, duration });
        reloadScan();
      } catch (e) {
        flash('Fehler beim unendlichen AP-Scan', 'danger');
        loopingRefAp.current = false;
        setLoopingAp(null);
        return;
      }

      if (loopingRefAp.current) setTimeout(loop, duration * 1000);
    };

    loop();
  };


  if (!scan) return <Body><p>Lade Scan-Daten...</p></Body>;

  return (
    <Body>
      <Button variant="primary" className="mb-3" onClick={() => navigate('/scans')}>
        Übersicht
      </Button>

      {loopingRef.current && scanIdRef.current === scan.id && (
        <Alert variant="warning" className="d-flex justify-content-between align-items-center">
          <div>Unendlicher WiFi-Scan läuft. <strong>Bitte diese Seite geöffnet lassen.</strong></div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              loopingRef.current = false;
              flash('Unendlicher Scan wird gestoppt – das kann bis zu 90 Sekunden dauern.', 'warning');
            }}
          >
            Stop ∞
          </Button>
        </Alert>
      )}

      {loopingAp && (
        <Alert variant="warning" className="d-flex justify-content-between align-items-center">
          <div>
            Unendlicher AP-Scan läuft für {loopingAp}. <strong>Bitte diese Seite geöffnet lassen.</strong>
          </div>
          <Button variant="outline-danger" size="sm" onClick={stopLoopScanAp}>
            Stoppen
          </Button>
        </Alert>
      )}

      <ScanHeader
        scan={scan}
        onDownload={() => handleDownload(scan, api.base_url, flash)}
        onUpdate={updateScan}
      />



      <AccessPoints
        scan={scan}
        onRescanComplete={reloadScan}
        loopingAp={loopingAp}
        startLoopScanAp={startLoopScanAp}
        stopLoopScanAp={stopLoopScanAp}
      />
      <hr />
      <UnlinkedClients scan={scan} />
    </Body>
  );
}