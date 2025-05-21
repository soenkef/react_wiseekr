// src/components/AccessPoints.js
import React, { useState, useEffect, useMemo } from 'react';
import Card from 'react-bootstrap/Card';
import Collapse from 'react-bootstrap/Collapse';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {
  FiAlertTriangle,
  FiFilter,
  FiWifiOff,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { handleDownloadFile } from '../utils/download';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';
import { DeauthModal, RescanModal } from './Modals';

export default function AccessPoints({ scan }) {
  const api = useApi();
  const flash = useFlash();
  const scanId = scan.id;

  // State
  const [openMap, setOpenMap] = useState({});
  const [apSort, setApSort] = useState({ field: null, asc: true });

  // Deauth state
  const [showDeauthModal, setShowDeauthModal] = useState(false);
  const [selectedAp, setSelectedAp] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deauthOptions, setDeauthOptions] = useState({ packets: 10, duration: 30 });
  const [activeDeauths, setActiveDeauths] = useState({});
  const [handshakeFiles, setHandshakeFiles] = useState({});
  const [infinitePackets, setInfinitePackets] = useState(false);

  // Rescan state
  const [showRescanModal, setShowRescanModal] = useState(false);
  const [rescanBssid, setRescanBssid] = useState(null);
  const [rescanOptions, setRescanOptions] = useState({ description: '', duration: 30 });
  const [activeRescans, setActiveRescans] = useState({});
  const [rescanProgress, setRescanProgress] = useState(0);
  const [rescanStartTime, setRescanStartTime] = useState(null);
  const [rescanDurationState, setRescanDurationState] = useState(0);

  // Extract handshake filenames
  useEffect(() => {
    if (!scan) return;
    const hf = {};
    scan.access_points.forEach(ap => {
      if (ap.handshake_file) hf[`${ap.bssid}|AP`] = ap.handshake_file.split('/').pop();
      ap.clients.forEach(c => {
        if (c.handshake_file) hf[`${ap.bssid}|${c.mac}`] = c.handshake_file.split('/').pop();
      });
    });
    setHandshakeFiles(hf);
  }, [scan]);

  // Rescan progress
  useEffect(() => {
    if (rescanStartTime == null) return;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - rescanStartTime) / 1000;
      const pct = Math.min(100, (elapsed / rescanDurationState) * 100);
      setRescanProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [rescanStartTime, rescanDurationState]);

  // Sorting
  const handleSortSelect = field =>
    setApSort(p => ({ field, asc: p.field === field ? !p.asc : true }));

  const sortedAPs = useMemo(() => {
    const list = [...(scan.access_points || [])];
    const { field, asc } = apSort;
    if (!field) return list;
    return list.sort((a, b) => {
      let av =
        field === 'last_seen'
          ? new Date(a.last_seen || 0).getTime()
          : a[field] ?? '';
      let bv =
        field === 'last_seen'
          ? new Date(b.last_seen || 0).getTime()
          : b[field] ?? '';
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
  }, [scan.access_points, apSort]);

  // Deauth handlers
  const handleDeauthAp = bssid => {
    setSelectedAp(bssid);
    setSelectedClient(null);
    setShowDeauthModal(true);
  };
  const handleDeauthClient = (bssid, client) => {
    setSelectedAp(bssid);
    setSelectedClient(client);
    setShowDeauthModal(true);
  };
  const submitDeauth = async () => {
    setShowDeauthModal(false);
    flash('Deauth process started...', 'warning');
    const key = `${selectedAp}|${selectedClient || 'AP'}`;
    setActiveDeauths(prev => ({ ...prev, [key]: true }));
    const apInfo = scan.access_points.find(a => a.bssid === selectedAp) || {};
    const channel = apInfo.channel || 6;
    let endpoint, payload;
    if (selectedClient) {
      endpoint = '/deauth/start_deauth_client';
      payload = {
        scan_id: scanId,
        ap_mac: selectedAp,
        client_mac: selectedClient,
        channel,
        packets: deauthOptions.packets,
        duration: deauthOptions.duration,
      };
    } else {
      endpoint = '/deauth/start';
      payload = {
        scan_id: scanId,
        mac: selectedAp,
        channel,
        is_client: false,
        packets: deauthOptions.packets,
        duration: deauthOptions.duration,
      };
    }
    const resp = await api.post(endpoint, payload);
    setActiveDeauths(prev => { const nxt = { ...prev }; delete nxt[key]; return nxt; });
    if (resp.ok) {
      flash(resp.body.message || 'Deauth abgeschlossen.', 'success');
      if (resp.body.file) setHandshakeFiles(prev => ({ ...prev, [key]: resp.body.file }));
    } else {
      flash(resp.body?.error || 'Deauth fehlgeschlagen.', 'danger');
    }
  };
  const renderDeauthStatus = (bssid, client) => {
    const key = `${bssid}|${client || 'AP'}`;
    return activeDeauths[key]
      ? <Spinner animation="border" size="sm" variant="danger" />
      : null;
  };
  const renderHandshakeLink = (bssid, client) => {
    const key = `${bssid}|${client || 'AP'}`;
    const filename = handshakeFiles[key];
    if (!filename) return null;
    return (
      <Button
        variant="success"
        size="sm"
        className="ms-2 d-inline-flex align-items-center"
        onClick={e => {
          e.stopPropagation();
          handleDownloadFile(scanId, filename, api.base_url, flash);
        }}
      >
        <FiDownload className="me-1" />Handshake
      </Button>
    );
  };

  // Rescan handlers
  const handleRescan = bssid => {
    setRescanBssid(bssid);
    setRescanOptions({ description: '', duration: 30 });
    setRescanDurationState(30);
    setRescanStartTime(Date.now());
    setShowRescanModal(true);
  };
  const submitRescan = async () => {
    setShowRescanModal(false);
    flash('Rescan gestartet...', 'success');
    setActiveRescans(prev => ({ ...prev, [rescanBssid]: true }));
    setRescanDurationState(rescanOptions.duration);
    setRescanStartTime(Date.now());
    setRescanProgress(0);
    const resp = await api.post(`/scans/${scanId}/scan_ap`, {
      bssid: rescanBssid,
      channel: scan.access_points.find(ap => ap.bssid === rescanBssid)?.channel,
    });
    setActiveRescans(prev => { const u = { ...prev }; delete u[rescanBssid]; return u; });
    if (resp.ok) {
      flash('Rescan abgeschlossen.', 'success');
    } else {
      flash(resp.body?.error || 'Rescan fehlgeschlagen.', 'danger');
    }
  };

  const toggle = bssid => setOpenMap(m => ({ ...m, [bssid]: !m[bssid] }));

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h4>Access Points</h4>
        <Dropdown as={ButtonGroup}>
          <Button variant="outline-secondary" size="sm"><FiFilter /> Sortieren</Button>
          <Dropdown.Toggle split variant="outline-secondary" size="sm" />
          <Dropdown.Menu>
            {['power', 'essid', 'vendor', 'last_seen'].map(f => (
              <Dropdown.Item key={f} onClick={() => handleSortSelect(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {apSort.field === f && (apSort.asc ? ' ↑' : ' ↓')}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <hr />

      {sortedAPs.map(ap => {
        const hasCam = ap.clients.some(c => c.is_camera);
        return (
          <Card key={ap.bssid} className="mb-2">
            <Card.Header onClick={() => toggle(ap.bssid)} style={{ cursor: 'pointer' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {hasCam && <FiAlertTriangle className="text-warning me-1" />}
                  <strong>{ap.essid || '<Hidden>'}</strong>
                </div>
                <ButtonGroup className="d-flex gap-1">
                  {renderDeauthStatus(ap.bssid)}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={e => { e.stopPropagation(); handleDeauthAp(ap.bssid); }}
                  >
                    <FiWifiOff /> Deauth
                  </Button>
                  {renderHandshakeLink(ap.bssid)}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={!!activeRescans[ap.bssid]}
                    onClick={e => { e.stopPropagation(); handleRescan(ap.bssid); }}
                  >
                    <FiRefreshCw />
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={e => { e.stopPropagation(); toggle(ap.bssid); }}
                  >
                    {openMap[ap.bssid] ? <FiChevronUp /> : <FiChevronDown />}
                  </Button>
                </ButtonGroup>
              </div>
              {rescanBssid === ap.bssid && rescanStartTime !== null && (
                <ProgressBar
                  now={rescanProgress}
                  animated
                  striped
                  style={{ height: '4px', marginTop: '0.5rem', borderRadius: '2px' }}
                />
              )}
            </Card.Header>
            <Collapse in={openMap[ap.bssid]}>
              <Card.Body>
                {/* Details hier */}
              </Card.Body>
            </Collapse>
          </Card>
        );
      })}

      <DeauthModal
        show={showDeauthModal}
        onHide={() => setShowDeauthModal(false)}
        onSubmit={submitDeauth}
        packets={deauthOptions.packets}
        duration={deauthOptions.duration}
        infinite={infinitePackets}
        setInfinite={setInfinitePackets}
      />
      <RescanModal
        show={showRescanModal}
        onHide={() => setShowRescanModal(false)}
        onSubmit={submitRescan}
        duration={rescanOptions.duration}
        description={rescanOptions.description}
      />
    </>
  );
}