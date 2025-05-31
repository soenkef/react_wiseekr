import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Body from '../components/Body';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate } from 'react-router-dom';
import { useFlash } from '../contexts/FlashProvider';
import { useApi } from '../contexts/ApiProvider';
import { useUser } from '../contexts/UserProvider';
import { handleDownloadAll } from '../utils/download';
import { useScanLoop } from '../contexts/ScanLoopProvider';
import ZigbeeScanOverview from '../components/ZigbeeScanOverview';


// Neue Komponente importieren
import ScanOverview from '../components/ScanOverview';

export default function ScanOverviewPage() {
  const [search, setSearch] = useState('');
  const [scans, setScans] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const [newScan, setNewScan] = useState({ description: '', location: '', duration: 30 });
  const [showClearModal, setShowClearModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const flash = useFlash();
  const api = useApi();
  const [scanOutput, setScanOutput] = useState('');

const [showZigbeeModal, setShowZigbeeModal] = useState(false);
  const [zigbeeOptions, setZigbeeOptions] = useState({
    description: '',
    location: '',
    duration: 30,
  });
  const [zigbeeScans, setZigbeeScans] = useState([]);
  const [zigbeeDevices, setZigbeeDevices] = useState([]);
  const [zigbeeScanDevices, setZigbeeScanDevices] = useState([]);
  const [zigbeeScanActive, setZigbeeScanActive] = useState(false);
  const [zigbeeScanTimeLeft, setZigbeeScanTimeLeft] = useState(0); // Countdown für die verbleibende Zeit


  const loadZigbeeData = useCallback(async () => {
    try {
      const [devicesRes, scanLinksRes, scansRes] = await Promise.all([
        api.get('/scan/zigbee/devices'),
        api.get('/scan/zigbee/scan_devices'),
        api.get('/scan/zigbee/scans')
      ]);

      if (scansRes.ok) setZigbeeScans(scansRes.body);
      if (devicesRes.ok) setZigbeeDevices(devicesRes.body);
      if (scanLinksRes.ok) setZigbeeScanDevices(scanLinksRes.body);

    } catch (err) {
      flash('Fehler beim Laden der Zigbee-Daten', 'danger');
    }
  }, [api, flash]);


  useEffect(() => {
    loadZigbeeData();
  }, [loadZigbeeData]);

  // Loop state

  const { loopingRef, scanIdRef } = useScanLoop();


  // für die Fortschrittsanzeige
  const [progress, setProgress] = useState(0);
  const [scanStart, setScanStart] = useState(null);
  const [scanDuration, setScanDuration] = useState(0);

  // fürs Editieren von Scans
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScan, setEditingScan] = useState(null);
  const [editValues, setEditValues] = useState({ description: '', location: '' });

  // Sort-State
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', asc: false });

  const loadScans = useCallback(async () => {
    const response = await api.get('/scans');
    if (response.ok) {
      // Duplikate nach ID entfernen
      const unique = Array.from(
        new Map(response.body.map(scan => [scan.id, scan])).values()
      );
      setScans(unique);
    } else {
      flash(response.body?.error || 'Fehler beim Laden der Scans', 'danger');
    }
  }, [api, flash]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  useEffect(() => {
    if (scanStart === null) return;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - scanStart) / 1000;
      const pct = Math.min(100, (elapsed / scanDuration) * 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [scanStart, scanDuration]);

  const handleDeleteClick = id => {
    setScanToDelete(id);
    setShowDeleteModal(true);
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setScanToDelete(null);
  };
  const confirmDelete = async () => {
    const resp = await api.delete(`/scans/${scanToDelete}`);
    if (resp.ok) {
      flash('Scan und alle Daten gelöscht.', 'success');
      setScans(prev => prev.filter(s => s.id !== scanToDelete));
    } else {
      flash('Fehler beim Löschen: ' + (resp.body?.error || ''), 'danger');
    }
    setShowDeleteModal(false);
    setScanToDelete(null);
  };

  const handleClearDatabase = async () => {
    setShowClearModal(false);
    setImporting(true);
    const response = await api.post('/clear_db');
    if (response.ok) {
      flash('Datenbanken und Dateien wurden erfolgreich gelöscht.', 'success');
      await loadScans();
    } else {
      flash(response.body?.error || 'Fehler beim Löschen der Daten.', 'danger');
    }
    setImporting(false);
  };

  const handleNavigate = id => {
    navigate(`/scan/${id}`);
  };

  // Einzel-Scan oder Append
  const executeScan = useCallback(async (duration, isFirst) => {
    setScanDuration(duration);
    setScanStart(Date.now());
    setProgress(0);
    setImporting(true);

    try {
      let resp;
      if (isFirst) {
        // erster Aufruf: lege neuen Scan an
        resp = await api.post('/scan/start', {
          duration,
          description: newScan.description,
          location: newScan.location,
        });

        if (resp.ok) {
          const id = resp.body.scan_id;
          scanIdRef.current = id;
          // sofort zur Detailseite weiterleiten
          navigate(`/scan/${id}`);
        }
      } else {
        // alle weiteren: hänge an bestehenden Scan dran
        resp = await api.post('/scan/append', {
          scan_id: scanIdRef.current,
          duration,
        });
      }

      if (!resp.ok) {
        flash(resp.body?.error || 'Scan fehlgeschlagen', 'danger');
        loopingRef.current = false;
        scanIdRef.current = null;
      } else {
        await loadScans();
      }
    } catch {
      flash('Netzwerkfehler beim Scan', 'danger');
      loopingRef.current = false;
      scanIdRef.current = null;
    } finally {
      setImporting(false);
      setScanStart(null);
      setProgress(100);
    }
  }, [api, flash, loadScans, newScan, navigate, scanIdRef, loopingRef]);

  // Loop starten / stoppen
  const startLoop = async () => {
    setShowNewScanModal(false);
    loopingRef.current = true;

    try {
      // Nur Scan-Datensatz erstellen
      const createResp = await api.post('/scan/create', {
        description: newScan.description,
        location: newScan.location,
        duration: 0,          // ✅ Bei unendlichem Scan: 0
        infinite: true        // ✅ optional, falls du das im Backend brauchst
      });

      if (!createResp.ok) throw new Error(createResp.body?.error || 'Erstellung fehlgeschlagen');

      const id = createResp.body.scan_id;
      scanIdRef.current = id;

      // ⏩ Sofort weiterleiten
      navigate(`/scan/${id}`);

      // Danach Loop starten
      const loop = async () => {
        const duration = 90;

        try {
          const appendResp = await api.post('/scan/append', {
            scan_id: scanIdRef.current,
            duration,
          });

          if (!appendResp.ok) {
            throw new Error(appendResp.body?.error || 'Append fehlgeschlagen');
          }

          await loadScans();
        } catch (err) {
          flash(err.message || 'Fehler im Loop', 'danger');
          loopingRef.current = false;
          scanIdRef.current = null;
          return;
        }

        if (loopingRef.current) {
          setTimeout(loop, duration * 1000);
        }
      };

      loop();

    } catch (err) {
      flash(err.message || 'Scanfehler', 'danger');
      loopingRef.current = false;
      scanIdRef.current = null;
    }
  };



  const stopLoop = () => {
    loopingRef.current = false;
    scanIdRef.current = null;
    setScanStart(null);
    setProgress(0);
    flash('Scan wird beendet – das kann bis zu 90 Sekunden dauern. Bitte diese Seite geöffnet lassen.', 'warning');
  };

  const handleNewScanSubmit = () => {
    if (infinite) {
      startLoop();
    } else {
      setShowNewScanModal(false);
      executeScan(newScan.duration, true);
    }
  };

  const openEditModal = scan => {
    setEditingScan(scan);
    setEditValues({ description: scan.description || '', location: scan.location || '' });
    setShowEditModal(true);
  };
  const submitEdit = async () => {
    const resp = await api.put(`/scans/${editingScan.id}`, editValues);
    if (resp.ok) {
      flash('Scan gespeichert', 'success');
      setScans(scans.map(s => (s.id === editingScan.id ? { ...s, ...resp.body } : s)));
      setShowEditModal(false);
    } else {
      flash(resp.body?.error || 'Speichern fehlgeschlagen', 'danger');
    }
  };

  // Filter + Sort
  const filtered = scans.filter(scan => {
    const q = search.toLowerCase();
    return (
      scan.description?.toLowerCase().includes(q) ||
      scan.location?.toLowerCase().includes(q) ||
      scan.filename?.toLowerCase().includes(q) ||
      scan.created_at?.toLowerCase().includes(q) ||
      scan.access_points_count?.toString().includes(q)
    );
  });
  const sortedScans = useMemo(() => {
    const list = [...filtered];
    const { field, asc } = sortConfig;
    list.sort((a, b) => {
      let va = a[field], vb = b[field];
      if (field === 'created_at') {
        va = new Date(a.created_at).getTime();
        vb = new Date(b.created_at).getTime();
      }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortConfig]);

  const startZigbeeScan = async () => {
    setImporting(true);
    setScanStart(Date.now());
    setScanDuration(zigbeeOptions.duration);
    setZigbeeScanActive(true); // Scan beginnt

    const timeoutId = setTimeout(() => {
      setZigbeeScanActive(false); // Nach Ablauf: Hinweis ausblenden
    }, zigbeeOptions.duration * 1000);

    try {
      const resp = await api.post('/scan/zigbee/start', {
        duration: zigbeeOptions.duration,
        description: zigbeeOptions.description,
        location: zigbeeOptions.location,
        channels: zigbeeOptions.channels || []
      });

      if (resp.ok) {
        flash(`Zigbee-Scan erfolgreich (${resp.body.device_count} Geräte)`, 'success');
        await loadScans();
      } else {
        flash(resp.body?.error || 'Zigbee-Scan fehlgeschlagen', 'danger');
        clearTimeout(timeoutId);
        setZigbeeScanActive(false);
      }
    } catch (err) {
      flash('Fehler beim Zigbee-Scan', 'danger');
      clearTimeout(timeoutId);
      setZigbeeScanActive(false);
    } finally {
      setImporting(false);
      setScanStart(null);
      setProgress(0);
    }
  };





  const requestSort = field => {
    setSortConfig(c =>
      c.field === field ? { field, asc: !c.asc } : { field, asc: true }
    );
  };
  const headerArrow = field => (sortConfig.field !== field ? '' : (sortConfig.asc ? ' ↑' : ' ↓'));


  return (
    <Body>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3">
        <h2 className="me-3 mb-2 mb-sm-0">Alle Scans</h2>
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 w-100 w-sm-auto">
          {/* Buttons immer zuerst */}
          <div className="d-flex gap-2">
            {user?.id === 1 && (
              <Button variant="danger" onClick={() => setShowClearModal(true)} disabled={importing}>
                Alle Daten löschen
              </Button>
            )}
            {infinite && loopingRef.current ? (
              <Button
                variant="warning"
                onClick={stopLoop}
                disabled={!loopingRef.current} // ← nur deaktivieren, wenn nicht im Loop
              >
                Stop ∞
              </Button>
            ) : (
              <>
                <Button variant="success" onClick={() => setShowNewScanModal(true)} disabled={importing}>
                  Scan starten
                </Button>

                {/* ✅ Zigbee-Scan-Button */}
                <Button variant="info" onClick={() => setShowZigbeeModal(true)} disabled={importing}>
                  Zigbee-Scan
                </Button>

              </>

            )}

          </div>

          {/* Fortschritt und Spinner */}
          {zigbeeScanActive && (
            <div className="alert alert-warning w-100 mb-3">
              <strong>Zigbee-Scan läuft...</strong> Bitte diese Seite geöffnet lassen, bis der Scan abgeschlossen ist. 
            </div>
          )}

          {/* Progress / Spinner */}
          {scanStart !== null && (
            <div className="mb-3 text-center">
              {infinite && loopingRef.current ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Scan läuft (∞ Loop)</span>
                </>
              ) : (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Scan läuft ({scanDuration}s)</span>
                  <ProgressBar
                    animated
                    striped
                    now={progress}
                    label={`${Math.round(progress)} %`}
                    className="mt-2"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scan-Übersicht als Komponente */}
      <ScanOverview
        scans={sortedScans}
        search={search}
        onSearchChange={e => setSearch(e.target.value)}
        requestSort={requestSort}
        headerArrow={headerArrow}
        onNavigate={handleNavigate}
        onDelete={handleDeleteClick}
        onEdit={openEditModal}
        onDownload={s => handleDownloadAll(s, api.base_url, flash)}
      />

      {/* Zigbee-Übersicht   */}
      <ZigbeeScanOverview
        scans={zigbeeScans}
        devices={zigbeeDevices}
        scanDevices={zigbeeScanDevices}
      />


      {/* Zigbee Modal direkt in ScanOverviewPage.js */}
      <Modal show={showZigbeeModal} onHide={() => setShowZigbeeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Zigbee-Scan starten</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control
                type="text"
                value={zigbeeOptions.description}
                onChange={e =>
                  setZigbeeOptions(v => ({ ...v, description: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ort</Form.Label>
              <Form.Control
                type="text"
                value={zigbeeOptions.location}
                onChange={e =>
                  setZigbeeOptions(v => ({ ...v, location: e.target.value }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dauer insgesamt ({zigbeeOptions.duration}s)</Form.Label>
              <RangeSlider
                value={zigbeeOptions.duration}
                onChange={e =>
                  setZigbeeOptions(v => ({
                    ...v,
                    duration: parseInt(e.target.value)
                  }))
                }
                min={10}
                max={300}
                step={10}
                tooltip="off"
                className="mb-2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kanäle auswählen</Form.Label>
              <Form.Control
                as="select"
                multiple
                value={zigbeeOptions.channels || []}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value));
                  setZigbeeOptions(v => ({ ...v, channels: selected }));
                }}
                style={{ height: '160px' }}
              >
                {Array.from({ length: 16 }, (_, i) => 11 + i).map(channel => (
                  <option key={channel} value={channel}>
                    Kanal {channel}
                  </option>
                ))}
              </Form.Control>
              <Form.Text muted>
                Halte ⌘ (Mac) oder Strg (Windows) gedrückt, um mehrere auszuwählen.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowZigbeeModal(false)}>
            Abbrechen
          </Button>
          <Button
            variant="info"
            onClick={async () => {
              setShowZigbeeModal(false); // Modal direkt schließen
              await startZigbeeScan();   // Scan starten
            }}
          >
            Zigbee-Scan starten
          </Button>
        </Modal.Footer>
      </Modal>



      {/* Delete Confirmation */}
      <Modal show={showDeleteModal} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scan löschen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bist du sicher, dass du diesen Scan und alle zugehörigen Daten löschen möchtest?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>Abbrechen</Button>
          <Button variant="danger" onClick={confirmDelete}>Löschen</Button>
        </Modal.Footer>
      </Modal>

      {/* Clear Database */}
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Datenbank löschen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchtest du wirklich alle Scan-bezogenen Daten und Dateien löschen?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>Abbrechen</Button>
          <Button variant="danger" onClick={handleClearDatabase}>Löschen</Button>
        </Modal.Footer>
      </Modal>

      {/* New Scan Modal */}
      <Modal show={showNewScanModal} onHide={() => setShowNewScanModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Neuen Scan starten</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control
                type="text"
                value={newScan.description}
                onChange={e => setNewScan(v => ({ ...v, description: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ort</Form.Label>
              <Form.Control
                type="text"
                value={newScan.location}
                onChange={e => setNewScan(v => ({ ...v, location: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Dauer ({infinite ? '∞' : `${newScan.duration} Sekunden`})
              </Form.Label>
              {!infinite && (
                <RangeSlider
                  value={newScan.duration}
                  onChange={e => setNewScan(v => ({ ...v, duration: parseInt(e.target.value) }))}
                  min={10} max={600} step={10}
                  tooltip="off"
                  className="mb-2"
                />
              )}
              <Form.Check
                type="switch"
                id="switch-infinite"
                label="Unendlich (Loop)"
                checked={infinite}
                onChange={e => setInfinite(e.target.checked)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewScanModal(false)}>Abbrechen</Button>
          <Button variant="success" onClick={handleNewScanSubmit}>Scan starten</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit-Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scan bearbeiten</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control
                type="text"
                value={editValues.description}
                onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ort</Form.Label>
              <Form.Control
                type="text"
                value={editValues.location}
                onChange={e => setEditValues(v => ({ ...v, location: e.target.value }))}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={submitEdit}>
            Speichern
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Scan-Ausgabe */}
      {user?.id === 1 && scanOutput && (
        <div className="mt-4">
          <h5>Scan-Ausgabe</h5>
          <pre className="p-3 bg-light rounded">{scanOutput}</pre>
        </div>
      )}
    </Body>
  );
}
