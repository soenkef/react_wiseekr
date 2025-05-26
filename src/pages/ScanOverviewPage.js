import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Body from '../components/Body';
import TimeAgo from '../components/TimeAgo';
import { useNavigate } from 'react-router-dom';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useFlash } from '../contexts/FlashProvider';
import { useApi } from '../contexts/ApiProvider';
import { useUser } from '../contexts/UserProvider';
import { FiDownload, FiTrash, FiEdit } from 'react-icons/fi';
import { handleDownloadAll } from '../utils/download';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

export default function ScanOverviewPage() {
  const [search, setSearch] = useState('');
  const [scans, setScans] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const [newScan, setNewScan] = useState({ description: '', location: '', duration: 30 });
  const [scanOutput, setScanOutput] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const flash = useFlash();
  const api = useApi();

  // für die Fortschrittsanzeige
  const [progress, setProgress] = useState(0);
  const [scanStart, setScanStart] = useState(null);
  const [scanDuration, setScanDuration] = useState(0);

  // fürs Editieren von Scans
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScan, setEditingScan] = useState(null);
  const [editValues, setEditValues] = useState({ description: '', location: '' });

  // --- NEU: Sort-State ---
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', asc: false });


  const loadScans = useCallback(async () => {
    const response = await api.get('/scans');
    if (response.ok) { 
      setScans(response.body);
    }
    else {
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

  const handleDeleteClick = (id) => {
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

  const handleNavigate = (id) => {
    navigate(`/scan/${id}`);
  };

  const handleNewScanSubmit = async () => {
    const duration = infinite ? 600 : newScan.duration;
    setScanDuration(duration);
    setScanStart(Date.now());
    setProgress(0);
    setShowNewScanModal(false);
    flash('Scan wurde gestartet. Bitte habe etwas Geduld.', 'success');
    setImporting(true);

    try {
      const payload = { duration, description: newScan.description, location: newScan.location };
      const response = await api.post('/scan/start', payload);

      if (!response.ok) {
        // falls schon ein Scan läuft, bekommt ihr 400 + { error: "Ein Scan läuft bereits…" }
        if (response.status === 400) {
          flash(response.body.error, 'warning');
        } else {
          flash(response.body.error || 'Scan fehlgeschlagen.', 'danger');
        }
        // abbrechen und Fortschritts-UI zurücksetzen
        setImporting(false);
        setScanStart(null);
        setProgress(0);
        return;
      }

      // on success
      const { output } = response.body;
      setScanOutput(output || 'Scan abgeschlossen.');
      flash('Scan erfolgreich', 'success');
      await loadScans();

    } catch {
      flash('Netzwerkfehler beim Starten des Scans.', 'danger');
      setScanOutput('Fehler beim Abrufen des Scan-Ergebnisses.');
    } finally {
      setImporting(false);
      setScanStart(null);
      setProgress(100);
      setNewScan({ description: '', location: '', duration });
      setInfinite(false);
    }
  };

  // Öffnet den Edit-Modal und füllt die Felder
  const openEditModal = scan => {
    setEditingScan(scan);
    setEditValues({ description: scan.description || '', location: scan.location || '' });
    setShowEditModal(true);
  };

  // Sendet die Änderungen ans Backend
  const submitEdit = async () => {
    const resp = await api.put(`/scans/${editingScan.id}`, editValues);
    if (resp.ok) {
      flash('Scan gespeichert', 'success');
      // in-state updaten, damit Tabelle sofort reflektiert
      setScans(scans.map(s =>
        s.id === editingScan.id ? { ...s, ...resp.body } : s
      ));
      setShowEditModal(false);
    } else {
      flash(resp.body?.error || 'Speichern fehlgeschlagen', 'danger');
    }
  };

  // --- Filter + Sort ---
  const filtered = scans.filter(scan =>
    Object.values(scan).some(v => v?.toString().toLowerCase().includes(search.toLowerCase()))
  );
  const sortedScans = useMemo(() => {
    const list = [...filtered];
    const { field, asc } = sortConfig;
    list.sort((a, b) => {
      let va = a[field], vb = b[field];
      // Datum parsen
      if (field === 'created_at') {
        va = new Date(a.created_at).getTime();
        vb = new Date(b.created_at).getTime();
      }
      // Strings case-insensitive
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortConfig]);


  const requestSort = field => {
    setSortConfig(c =>
      c.field === field
        ? { field, asc: !c.asc }
        : { field, asc: true }
    );
  };

  const headerArrow = field => {
    if (sortConfig.field !== field) return '';
    return sortConfig.asc ? ' ↑' : ' ↓';
  };



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
            <Button variant="success" onClick={() => setShowNewScanModal(true)} disabled={importing}>
              Scan starten
            </Button>
          </div>

          {/* Progressbar: auf XS immer volle Breite unter den Buttons, ab SM ganz normal links daneben */}
          {scanStart !== null && (
            <>
              {/* mobile-only */}
              <div className="w-100 d-block d-sm-none mt-2">
                <small>Scan läuft</small>
                <ProgressBar now={progress} label={`${Math.round(progress)} %`} animated striped />
              </div>
              {/* desktop-only */}
              <div className="d-none d-sm-block text-center ms-2" style={{ minWidth: 160 }}>
                <small>Scan läuft</small>
                <ProgressBar now={progress} label={`${Math.round(progress)} %`} animated striped />
              </div>
            </>
          )}
        </div>
      </div>

      <Form.Control
        type="search"
        placeholder="Suche nach Scan, Ort, Zeit... - aktuell deaktiviert!"
        className="mb-3"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <Table striped hover responsive className="align-middle">
        <thead>
          <tr>
            <th onClick={() => requestSort('created_at')} style={{ cursor: 'pointer' }}>
              Erstellt am{headerArrow('created_at')}
            </th>
            <th onClick={() => requestSort('description')} style={{ cursor: 'pointer' }}>
              Beschreibung{headerArrow('description')}
            </th>
            <th onClick={() => requestSort('location')} style={{ cursor: 'pointer' }}>
              Ort{headerArrow('location')}
            </th>
            <th className="text-end" onClick={() => requestSort('access_points_count')} style={{ cursor: 'pointer' }}>
              #AP{headerArrow('access_points_count')}
            </th>
            <th className="text-end">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {sortedScans.map(s => (
            <tr key={s.id}
              onClick={e => !e.target.closest('button') && handleNavigate(s.id)}
              style={{ cursor: 'pointer' }}>
              <td>
                {s.created_at
                  ? new Date(s.created_at).toLocaleString('de-DE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })
                  : '–'}
                <br />
                <small className="text-muted">
                  (<TimeAgo isoDate={s.created_at} />)
                </small>
              </td>
              <td>
                {s.description || <em>keine Beschreibung</em>}
                <br />
                <small className="text-muted">
                  ({s.access_points_count} APs)
                </small>
              </td>
              <td>{s.location || <em>kein Ort</em>}</td>
              <td className="text-end">{s.access_points_count}</td>
              <td className="text-end">
                <ButtonGroup className="d-flex gap-1 align-items-center flex-shrink-0 flex-wrap justify-content-end">
                  {s.filename ? (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="ap-action-btn"
                      onClick={e => { e.stopPropagation(); handleDownloadAll(s, api.base_url, flash); }}
                    >
                      <FiDownload />
                    </Button>
                  ) : (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="ap-action-btn"
                      disabled
                    >
                      –
                    </Button>
                  )}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={e => { e.stopPropagation(); openEditModal(s); }}
                    title="Beschreibung/Ort bearbeiten"
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="ap-action-btn"
                    onClick={e => { e.stopPropagation(); handleDeleteClick(s.id); }}
                  >
                    <FiTrash />
                  </Button>
                </ButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

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
        <Modal.Header closeButton>
          <Modal.Title>Neuen Scan starten</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control
                type="text"
                value={newScan.description}
                onChange={e => setNewScan({ ...newScan, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ort</Form.Label>
              <Form.Control
                type="text"
                value={newScan.location}
                onChange={e => setNewScan({ ...newScan, location: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Dauer ({infinite ? '∞ unendlich' : `${newScan.duration} Sekunden`})
              </Form.Label>
              <RangeSlider
                value={infinite ? 600 : newScan.duration}
                onChange={e => setNewScan({ ...newScan, duration: parseInt(e.target.value) })}
                min={10} max={600} step={10}
                disabled={infinite}
                tooltip="off"
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Unendlich"
                checked={infinite}
                onChange={e => setInfinite(e.target.checked)}
              />
              <Form.Text className="text-muted">
                Wähle zwischen 10 Sek. und 10 Min. oder unendlich.
              </Form.Text>
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
