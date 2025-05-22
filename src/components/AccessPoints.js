import React, { useState, useEffect, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Spinner from 'react-bootstrap/Spinner';
import { FiFilter, FiDownload } from 'react-icons/fi';
import { handleDownloadFile } from '../utils/download';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';
import { DeauthModal, RescanModal } from './Modals';
import AccessPoint from './AccessPoint';

export default function AccessPoints({ scan, onRescanComplete }) {
  const api = useApi();
  const flash = useFlash();
  const scanId = scan.id;

  // UI state
  const [openMap, setOpenMap] = useState({});
  const [apSort, setApSort] = useState({ field: null, asc: true });

  // Deauth state + progress
  const [showDeauthModal, setShowDeauthModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState({ ap: null, client: null });
  const [deauthOptions, setDeauthOptions] = useState({ packets: 10, duration: 30, infinite: false });
  const [activeDeauths, setActiveDeauths] = useState({});
  const [deauthStartTime, setDeauthStartTime] = useState(null);
  const [deauthProgress, setDeauthProgress] = useState(0);
  const [deauthBssid, setDeauthBssid] = useState(null);

  // Rescan state + progress
  const [showRescanModal, setShowRescanModal] = useState(false);
  const [rescanOptions, setRescanOptions] = useState({ description: '', duration: 30 });
  const [rescanBssid, setRescanBssid] = useState(null);
  const [rescanStartTime, setRescanStartTime] = useState(null);
  const [rescanProgress, setRescanProgress] = useState(0);

  // Handshake files
  const [handshakeFiles, setHandshakeFiles] = useState({});
  useEffect(() => {
    const hf = {};
    scan.access_points.forEach(ap => {
      if (ap.handshake_file) hf[`${ap.bssid}|AP`] = ap.handshake_file.split('/').pop();
      ap.clients.forEach(c => {
        if (c.handshake_file) hf[`${ap.bssid}|${c.mac}`] = c.handshake_file.split('/').pop();
      });
    });
    setHandshakeFiles(hf);
  }, [scan.access_points]);

  // Sorting logic
  const handleSortSelect = field =>
    setApSort(prev => ({ field, asc: prev.field === field ? !prev.asc : true }));
  const sortedAPs = useMemo(() => {
    const list = [...scan.access_points];
    const { field, asc } = apSort;
    if (!field) return list;
    return list.sort((a, b) => {
      let av, bv;
      if (field === 'last_seen') {
        av = new Date(a.last_seen || 0).getTime();
        bv = new Date(b.last_seen || 0).getTime();
      } else if (field === 'clients') {
        av = a.clients.length;
        bv = b.clients.length;
      } else {
        av = a[field] ?? '';
        bv = b[field] ?? '';
      }
      return av < bv ? (asc ? -1 : 1) : av > bv ? (asc ? 1 : -1) : 0;
    });
  }, [scan.access_points, apSort]);

  // Deauth handlers
  const openDeauth = (ap, client = null) => {
    setSelectedTarget({ ap, client });
    setDeauthBssid(ap);
    setShowDeauthModal(true);
  };
  const submitDeauth = async () => {
    const { ap, client } = selectedTarget;
    const key = `${ap}|${client || 'AP'}`;
    setActiveDeauths(prev => ({ ...prev, [key]: true }));
    setDeauthStartTime(Date.now());
    setDeauthProgress(0);
    flash('Deauth startet...', 'warning');

    const payload = client
      ? { scan_id: scanId, ap_mac: ap, client_mac: client, channel: scan.access_points.find(a => a.bssid === ap)?.channel, packets: deauthOptions.packets, duration: deauthOptions.duration }
      : { scan_id: scanId, mac: ap, is_client: false, channel: scan.access_points.find(a => a.bssid === ap)?.channel, packets: deauthOptions.packets, duration: deauthOptions.duration };
    const path = client ? '/deauth/start_deauth_client' : '/deauth/start';

    try {
      const resp = await api.post(path, payload);
      if (!resp.ok) throw new Error(resp.body?.error || 'Fehler');
      flash('Deauth erfolgreich gestartet', 'success');
      if (resp.body.file) setHandshakeFiles(prev => ({ ...prev, [key]: resp.body.file }));
    } catch (err) {
      flash(err.message, 'danger');
    } finally {
      setActiveDeauths(prev => { const next = { ...prev }; delete next[key]; return next; });
      setShowDeauthModal(false);
      setDeauthStartTime(null);
      setDeauthBssid(null);
    }
  };
  const renderDeauthStatus = (ap, client) => {
    const key = `${ap}|${client || 'AP'}`;
    return activeDeauths[key]
      ? <Spinner animation="border" size="sm" variant="danger" className="me-1" />
      : null;
  };

  // Rescan handlers
  const openRescan = ap => { setRescanBssid(ap); setShowRescanModal(true); };

  const submitRescan = async () => {
    // 1) Modal schließen und Progress starten
    setShowRescanModal(false);
    setRescanStartTime(Date.now());
    setRescanProgress(0);
    flash('Rescan gestartet...', 'warning');

    // 2) API-Call
    try {
      const resp = await api.post(`/scans/${scanId}/scan_ap`, {
        bssid: rescanBssid,
        duration: rescanOptions.duration
      });
      if (!resp.ok) throw new Error(resp.body?.error || 'Fehler');
      flash('Rescan abgeschlossen', 'success');

      // 3) Daten neu laden
      onRescanComplete?.();
    } catch (err) {
      flash(err.message, 'danger');
    } finally {
      // Progress beenden
      setRescanStartTime(null);
    }
  };

  // Progress-Effekte
  useEffect(() => {
    if (deauthStartTime == null) return;
    const iv = setInterval(() => {
      const elapsed = (Date.now() - deauthStartTime) / 1000;
      const pct = Math.min(100, deauthOptions.duration > 0 ? elapsed / deauthOptions.duration * 100 : 100);
      setDeauthProgress(pct);
      if (pct >= 100) clearInterval(iv);
    }, 200);
    return () => clearInterval(iv);
  }, [deauthStartTime, deauthOptions.duration]);

  useEffect(() => {
    if (rescanStartTime == null) return;
    const iv = setInterval(() => {
      const elapsed = (Date.now() - rescanStartTime) / 1000;
      const pct = Math.min(100, rescanOptions.duration > 0 ? elapsed / rescanOptions.duration * 100 : 100);
      setRescanProgress(pct);
      if (pct >= 100) clearInterval(iv);
    }, 200);
    return () => clearInterval(iv);
  }, [rescanStartTime, rescanOptions.duration]);

  // Handshake-Link
  const renderHandshakeLink = (b, c) => {
    const key = `${b}|${c || 'AP'}`;
    const fn = handshakeFiles[key];
    if (!fn) return null;
    return (
      <Button variant="success" size="sm" className="ms-2"
        onClick={() => handleDownloadFile(scanId, fn, api.base_url, flash)}
      >
        <FiDownload className="me-1" />Handshake
      </Button>
    );
  };

  return (
    <>
      {/* Sortierleiste */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h4>Access Points</h4>
        <Dropdown as={ButtonGroup}>
          <Button variant="outline-secondary" size="sm"><FiFilter /> Sortieren</Button>
          <Dropdown.Toggle split variant="outline-secondary" size="sm" />
          <Dropdown.Menu>
            {['power', 'essid', 'vendor', 'last_seen', 'clients'].map(f => (
              <Dropdown.Item key={f} onClick={() => handleSortSelect(f)}>
                {f === 'essid' ? 'SSID' : f === 'last_seen' ? 'Zuletzt gesehen' : f === 'clients' ? 'Clients' : f.charAt(0).toUpperCase() + f.slice(1)}
                {apSort.field === f && (apSort.asc ? ' ↑' : ' ↓')}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <hr />

      {/* AccessPoints */}
      {sortedAPs.map(ap => (
        <AccessPoint
          key={ap.bssid}
          ap={ap}
          handshakeFiles={handshakeFiles}
          openMap={openMap}
          toggleOpen={b => setOpenMap(m => ({ ...m, [b]: !m[b] }))}
          onDeauthAp={openDeauth}
          onDeauthClient={openDeauth}
          onRescan={openRescan}
          renderDeauthStatus={renderDeauthStatus}
          renderHandshakeLink={renderHandshakeLink}
          activeDeauths={activeDeauths}
          deauthProgress={deauthProgress}
          deauthBssid={deauthBssid}
          rescanBssid={rescanBssid}
          rescanStartTime={rescanStartTime}
          rescanProgress={rescanProgress}
        />
      ))}

      {/* Modals */}
      <DeauthModal
        show={showDeauthModal}
        onHide={() => setShowDeauthModal(false)}
        options={deauthOptions}
        onChangeOptions={setDeauthOptions}
        onSubmit={submitDeauth}
      />
      <RescanModal
        show={showRescanModal}
        onHide={() => setShowRescanModal(false)}
        options={rescanOptions}
        onChangeOptions={setRescanOptions}
        onSubmit={submitRescan}
      />
    </>
  );
}
