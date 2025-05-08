import React, { useState, useEffect, useCallback } from 'react';
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
import { FiDownload } from 'react-icons/fi';
import { handleDownload } from '../utils/download';

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

  const loadScans = useCallback(async () => {
    const response = await api.get('/scans');
    if (response.ok) setScans(response.body);
    else flash(response.body?.error || 'Fehler beim Laden der Scans', 'danger');
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
      const payload = {
        duration,
        description: newScan.description,
        location: newScan.location,
      };
      const response = await api.post('/scan/start', payload);
      if (response.ok) {
        setScanOutput(response.body.output || 'Scan abgeschlossen.');
        flash('Scan erfolgreich', 'success');
        await loadScans();
      } else {
        setScanOutput(response.body?.error || 'Unbekannter Fehler beim Scan.');
        flash(response.body?.error || 'Scan fehlgeschlagen.', 'danger');
      }
    } catch {
      setScanOutput('Fehler beim Abrufen des Scan-Ergebnisses.');
      flash('Fehler beim Abrufen des Scan-Ergebnisses.', 'danger');
    } finally {
      setProgress(100);
      setImporting(false);
      setScanStart(null);
      setNewScan({ description: '', location: '', duration });
      setInfinite(false);
    }
  };

  const filteredScans = scans.filter(scan =>
    Object.values(scan).some(val => val?.toString().toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Body>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h2 className="me-3">Alle Scans</h2>
        <div className="d-flex flex-wrap align-items-center gap-2">
          {scanStart !== null && (
            <div className="text-center me-2" style={{ minWidth: 160 }}>
              <small>Scan läuft</small>
              <ProgressBar now={progress} label={`${Math.round(progress)} %`} animated striped />
            </div>
          )}
          {user?.id === 1 && (
            <Button variant="danger" onClick={() => setShowClearModal(true)} disabled={importing}>
              Alle Daten löschen
            </Button>
          )}
          <Button variant="success" onClick={() => setShowNewScanModal(true)} disabled={importing}>
            Scan starten
          </Button>
        </div>
      </div>

      <Form.Control
        type="search"
        placeholder="Suche nach Scan, Ort, Zeit..."
        className="mb-3"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <Table striped hover responsive className="align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Erstellt am</th>
            <th>Beschreibung</th>
            <th>Ort</th>
            <th>Download</th>
            <th className="text-end">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredScans.map(s => (
            <tr key={s.id} onClick={e => !e.target.closest('button') && handleNavigate(s.id)} style={{ cursor: 'pointer' }}>
              <td>{s.id}</td>
              <td>
                {new Date(s.created_at).toLocaleString('de-DE')}<br/>
                <small className="text-muted"><TimeAgo isoDate={s.created_at} /></small>
              </td>
              <td>{s.description}</td>
              <td>{s.location}</td>
              <td className="text-center">
                {s.filename
                  ? <Button size="sm" variant="outline-secondary" onClick={e => { e.stopPropagation(); handleDownload(s); }}>
                      <FiDownload />
                    </Button>
                  : '–'}
              </td>
              <td className="text-end">
                <Button size="sm" variant="outline-danger" onClick={e => { e.stopPropagation(); handleDeleteClick(s.id); }}>
                  Löschen
                </Button>
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
