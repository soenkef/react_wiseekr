import React, { useState, useEffect, useMemo, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
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

  const [openMap, setOpenMap] = useState({});
  const [apSort, setApSort] = useState({ field: 'power', asc: false });
  const [search, setSearch] = useState('');

  const [showDeauthModal, setShowDeauthModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState({ ap: null, client: null });
  const [deauthOptions, setDeauthOptions] = useState({ packets: 6, duration: 15, infinite: false });
  const [activeDeauths, setActiveDeauths] = useState({});
  const [infiniteDeauths, setInfiniteDeauths] = useState(new Set());
  const [deauthStartTime, setDeauthStartTime] = useState(null);
  const [deauthProgress, setDeauthProgress] = useState(0);
  const [deauthBssid, setDeauthBssid] = useState(null);

  const [showRescanModal, setShowRescanModal] = useState(false);
  const [rescanOptions, setRescanOptions] = useState({ description: '', duration: 30 });
  const [rescanBssid, setRescanBssid] = useState(null);
  const [rescanStartTime, setRescanStartTime] = useState(null);
  const [rescanProgress, setRescanProgress] = useState(0);
  const openRescan = ap => {
    setRescanBssid(ap);
    setShowRescanModal(true);
  };

  const [loopingAp, setLoopingAp] = useState(null); // BSSID im Loop
  const loopingRefAp = useRef(null); // persistenter Loop-Status
  const firstLoopRef = useRef(true);

  const [cracking, setCracking] = useState(new Set());

  const renderCrackButton = (ap) => {
    const apKey = `${ap.bssid}|AP`;
    const isCracking = cracking.has(apKey);

    // Handshake-Datei des APs oder eines seiner Clients finden
    let filename = handshakeFiles[apKey];

    if (!filename) {
      for (const client of ap.clients) {
        const clientKey = `${ap.bssid}|${client.mac}`;
        if (handshakeFiles[clientKey]) {
          filename = handshakeFiles[clientKey];
          break;
        }
      }
    }

    if (!filename) return null; // Nichts anzeigen

    return (
      <Button
        variant="secondary"
        size="sm"
        disabled={isCracking}
        onClick={async (e) => {
          e.stopPropagation();
          setCracking(prev => new Set(prev).add(apKey));
          try {
            const resp = await api.post(`/crack`, {
              ap_id: ap.id,
              filename
            });

            if (!resp.ok) {
              flash(resp.body?.error || 'Fehler beim Cracken', 'danger');
              setCracking(prev => {
                const next = new Set(prev);
                next.delete(apKey);
                return next;
              });
              return;
            }

            // Cracking gestartet → poll für Ergebnis
            const interval = setInterval(async () => {
              const status = await api.get(`/crack/status/${ap.id}`);
              if (!status.ok) return;

              const password = status.body?.cracked_password;
              if (password !== null && password !== undefined) {
                clearInterval(interval);
                setCracking(prev => {
                  const next = new Set(prev);
                  next.delete(apKey);
                  return next;
                });

                if (password) {
                  flash(`🔓 Passwort gefunden: ${password}`, 'success');
                } else {
                  flash('Crack-Vorgang abgeschlossen (kein Treffer)', 'warning');
                }

                onRescanComplete?.(); // scan-Daten neu laden
              }
            }, 5000); // alle 5s prüfen

          } catch (err) {
            flash('Netzwerkfehler beim Cracken', 'danger');
            setCracking(prev => {
              const next = new Set(prev);
              next.delete(apKey);
              return next;
            });
          }
        }}
        className="ms-2"
      >
        {isCracking ? (
          <>
            <Spinner animation="border" size="sm" className="me-1" />
            Crack läuft…
          </>
        ) : (
          'Crack'
        )}
      </Button>
    );
  };

  useEffect(() => {
    if (rescanStartTime == null || !rescanBssid) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - rescanStartTime) / 1000;
      const pct = Math.min(100, (elapsed / rescanOptions.duration) * 100);
      setRescanProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setRescanStartTime(null);
        setRescanBssid(null);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [rescanStartTime, rescanOptions.duration, rescanBssid]);




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
  }, [scan]);

  const handleSortSelect = field => {
    setApSort(prev => ({ field, asc: prev.field === field ? !prev.asc : true }));
  };

  const filteredAPs = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return scan.access_points.filter(ap => {
      const matchesAp = ap.bssid.toLowerCase().includes(lowerSearch)
        || ap.essid?.toLowerCase().includes(lowerSearch)
        || ap.vendor?.toLowerCase().includes(lowerSearch);

      const matchesClients = ap.clients.some(c =>
        c.mac.toLowerCase().includes(lowerSearch)
        || c.vendor?.toLowerCase().includes(lowerSearch)
      );

      return matchesAp || matchesClients;
    });
  }, [scan.access_points, search]);

  const sortedAPs = useMemo(() => {
    const list = [...filteredAPs];
    const { field, asc } = apSort;

    return list.sort((a, b) => {
      let av, bv;

      if (field === 'power') {
        // Wenn power === -1, behandeln wir es als schlechtestmöglichen Wert
        const normalizePower = v => (v === -1 || v == null ? Number.NEGATIVE_INFINITY : v);
        av = normalizePower(a.power);
        bv = normalizePower(b.power);
      } else if (field === 'last_seen') {
        av = new Date(a.last_seen || 0).getTime();
        bv = new Date(b.last_seen || 0).getTime();
      } else if (field === 'clients') {
        av = a.clients.length;
        bv = b.clients.length;
      } else {
        av = a[field] ?? '';
        bv = b[field] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
      }

      if (av < bv) return -1 * (asc ? 1 : -1);
      if (av > bv) return 1 * (asc ? 1 : -1);
      return 0;
    });
  }, [filteredAPs, apSort]);


  const openDeauth = (ap, client = null) => {
    setSelectedTarget({ ap, client });
    setDeauthBssid(ap);
    setShowDeauthModal(true);
  };

  const submitRescan = async () => {
    setShowRescanModal(false);
    setRescanStartTime(Date.now());
    setRescanProgress(0);
    flash('Rescan gestartet...', 'warning');
    try {
      const resp = await api.post(`/scans/${scanId}/scan_ap`, {
        bssid: rescanBssid,
        duration: rescanOptions.duration
      });
      if (!resp.ok) throw new Error(resp.body?.error || 'Fehler');
      flash('Rescan abgeschlossen', 'success');
      onRescanComplete?.();
    } catch (err) {
      flash(err.message, 'danger');
    } finally {
      setRescanStartTime(null);
    }
  };

const startLoopScanAp = async (bssid, duration = 90) => {
  setLoopingAp(bssid);
  loopingRefAp.current = true;
  firstLoopRef.current = true; // Setze beim Start

  const loop = async () => {
    if (!loopingRefAp.current) return;

    if (firstLoopRef.current) {
      flash(`Starte unendlichen AP-Scan für ${bssid}...`, 'danger');
      firstLoopRef.current = false; // Nur einmal zeigen
    } else {
      console.debug(`↻ Wiederhole AP-Scan für ${bssid}`);
    }

    try {
      const resp = await api.post(`/scans/${scanId}/scan_ap`, {
        bssid,
        duration
      });

      if (resp.ok) {
        onRescanComplete?.();
      } else {
        throw new Error(resp.body?.error || 'AP-Scan fehlgeschlagen');
      }

    } catch (err) {
      flash(err.message, 'danger');
      loopingRefAp.current = false;
      setLoopingAp(null);
      return;
    }

    if (loopingRefAp.current) {
      setTimeout(loop, duration * 1000);
    }
  };

  loop();
};



const stopLoopScanAp = () => {
  loopingRefAp.current = false;
  firstLoopRef.current = true; // Sauber zurücksetzen
  setLoopingAp(null);

  flash('Scan wird gestoppt – das kann bis zu 90 Sekunden dauern.', 'warning');
};



  const submitDeauth = async () => {
    const { ap, client } = selectedTarget;
    const key = `${ap}|${client || 'AP'}`;
    setActiveDeauths(prev => ({ ...prev, [key]: true }));
    if (deauthOptions.infinite) setInfiniteDeauths(prev => new Set(prev).add(key));
    setDeauthStartTime(Date.now());
    setDeauthProgress(0);
    flash('Deauth startet...', 'warning');

    const common = {
      scan_id: scanId,
      packets: deauthOptions.packets,
      ...(deauthOptions.infinite ? {} : { duration: deauthOptions.duration }),
      infinite: deauthOptions.infinite,
      channel: scan.access_points.find(a => a.bssid === ap)?.channel || 6,
    };
    const payload = client ? { ...common, ap_mac: ap, client_mac: client, is_client: true } : { ...common, mac: ap, is_client: false };
    const endpoint = client ? '/deauth/start_deauth_client' : '/deauth/start';

    try {
      const resp = await api.post(endpoint, payload);
      if (!resp.ok) throw new Error(resp.body?.error || 'Fehler');
      flash('Deauth erfolgreich gestartet', 'success');
      if (resp.body.file) setHandshakeFiles(prev => ({ ...prev, [key]: resp.body.file }));
    } catch (err) {
      flash(err.message, 'danger');
    } finally {
      setActiveDeauths(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setShowDeauthModal(false);
    }
  };

  const stopDeauth = async (ap, client = null) => {
    const macToStop = client || ap;
    flash('Stopping deauth…', 'warning');
    const resp = await api.post('/deauth/stop', { scan_id: scanId, mac: macToStop });
    const key = `${ap}|${client || 'AP'}`;
    if (resp.ok) {
      flash('Deauth gestoppt', 'success');
      setActiveDeauths(prev => { const next = { ...prev }; delete next[key]; return next; });
      setInfiniteDeauths(prev => { const next = new Set(prev); next.delete(key); return next; });
      setDeauthProgress(0);
      setDeauthStartTime(null);
      setDeauthBssid(null);
      setDeauthOptions(prev => ({ ...prev, infinite: false }));
    } else {
      flash(resp.body?.error || 'Stop failed', 'danger');
    }
  };

  useEffect(() => {
    if (deauthStartTime == null) return;
    const iv = setInterval(() => {
      const elapsed = (Date.now() - deauthStartTime) / 1000;
      const pct = Math.min(100,
        deauthOptions.duration > 0
          ? elapsed / deauthOptions.duration * 100
          : 100
      );
      setDeauthProgress(pct);
      if (pct >= 100) {
        clearInterval(iv);
        setDeauthStartTime(null);
        setDeauthBssid(null); // ⬅️ wichtig: erst jetzt zurücksetzen
      }
    }, 200);
    return () => clearInterval(iv);
  }, [deauthStartTime, deauthOptions.duration]);

  const renderDeauthStatus = (ap, client) => {
    const key = `${ap}|${client || 'AP'}`;
    return activeDeauths[key] ? <Spinner animation="border" size="sm" variant="danger" className="me-1" /> : null;
  };

  const renderHandshakeLink = (b, c) => {
    const key = `${b}|${c || 'AP'}`;
    const fn = handshakeFiles[key];
    if (!fn) return null;
    return (
      <Button variant="success" size="sm" className="ms-2" onClick={() => handleDownloadFile(scanId, fn, api.base_url, flash)}>
        <FiDownload className="me-1" />Handshake
      </Button>
    );
  };

  const renderHandshakeDropdown = ap => {
    const items = [];
    const keyAp = `${ap.bssid}|AP`;
    if (handshakeFiles[keyAp]) {
      items.push(<Dropdown.Item key={keyAp} onClick={e => { e.stopPropagation(); handleDownloadFile(scanId, handshakeFiles[keyAp], api.base_url, flash); }}>{ap.bssid}</Dropdown.Item>);
    }
    ap.clients.forEach(c => {
      const key = `${ap.bssid}|${c.mac}`;
      if (handshakeFiles[key]) {
        items.push(<Dropdown.Item key={key} onClick={e => { e.stopPropagation(); handleDownloadFile(scanId, handshakeFiles[key], api.base_url, flash); }}>{c.mac}</Dropdown.Item>);
      }
    });
    if (!items.length) return null;
    return (
      <div onClick={e => e.stopPropagation()} className="me-1">
        <DropdownButton variant="success" size="sm" title={<><FiDownload className="me-1" />Handshake</>} align="end">{items}</DropdownButton>
      </div>
    );
  };



  return (
    <>
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
      <Form.Control type="search" className="mb-3" placeholder="Suche nach BSSID, ESSID, Client MAC, Vendor..." value={search} onChange={e => setSearch(e.target.value)} />
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
          renderCrackButton={renderCrackButton}
          renderHandshakeDropdown={renderHandshakeDropdown}
          activeDeauths={activeDeauths}
          infiniteDeauths={infiniteDeauths}
          deauthProgress={deauthProgress}
          deauthBssid={deauthBssid}
          rescanBssid={rescanBssid}
          rescanStartTime={rescanStartTime}
          rescanProgress={rescanProgress}
          stopDeauth={stopDeauth}
          isCracking={cracking.has(`${ap.bssid}|AP`)}
          scanMeta={{ description: scan.description, location: scan.location }}
          loopingAp={loopingAp}
          startLoopScanAp={startLoopScanAp}
          stopLoopScanAp={stopLoopScanAp}
        />
      ))}
      <DeauthModal show={showDeauthModal} onHide={() => setShowDeauthModal(false)} options={deauthOptions} onChangeOptions={setDeauthOptions} onSubmit={submitDeauth} />
      <RescanModal show={showRescanModal} onHide={() => setShowRescanModal(false)} options={rescanOptions} onChangeOptions={setRescanOptions} onSubmit={submitRescan} />
    </>
  );
}
