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
import { useFlash } from '../contexts/FlashProvider';
import { useApi } from '../contexts/ApiProvider';
import { useUser } from '../contexts/UserProvider';
import { FiDownload } from 'react-icons/fi';
import { handleDownload } from '../utils/download';

export default function ScanOverviewPage() {
  const [search, setSearch] = useState('');
  const [scans, setScans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const [newScan, setNewScan] = useState({ name: '', description: '', location: '', duration: 60 });
  const [scanOutput, setScanOutput] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const flash = useFlash();
  const api = useApi();

  const loadScans = useCallback(async () => {
    const response = await api.get('/scans');
    if (response.ok) setScans(response.body);
    else flash(response.body?.error || 'Fehler beim Laden der Scans', 'danger');
  }, [api, flash]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const handleDeleteClick = (id) => {
    setScanToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = () => {
    setScans(prev => prev.filter(scan => scan.id !== scanToDelete));
    setShowModal(false);
    setScanToDelete(null);
  };

  const cancelDelete = () => {
    setShowModal(false);
    setScanToDelete(null);
  };

  const handleClearDatabase = async () => {
    setShowClearModal(false);
    setImporting(true);
    const response = await api.post('/clear_db');
    if (response.ok) {
      flash('Alle Daten wurden erfolgreich gelöscht.', 'success');
      await loadScans();
    } else {
      flash(response.body?.error || 'Fehler beim Löschen der Daten.', 'danger');
    }
    setImporting(false);
  };

  const handleNavigate = (id) => {
    if (id) navigate(`/scan/${id}`);
  };

  const handleNewScanSubmit = async () => {
    const duration = infinite ? 600 : newScan.duration;
    setShowNewScanModal(false);
    flash('Scan wurde gestartet. Bitte hab Geduld.', 'success');
    setNewScan({ name: '', description: '', location: '', duration: 60 });
    setInfinite(false);
    setImporting(true);
    try {
      const response = await api.post('/scan/start', { duration });
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
    }
    setImporting(false);
  };

  const handleImportClick = async () => {
    setImporting(true);
    try {
      const response = await api.post('/scans/import');
      if (response.ok) {
        flash('Import erfolgreich', 'info');
        await loadScans();
      } else {
        flash(response.body?.error || 'Import fehlgeschlagen', 'danger');
      }
    } catch {
      flash('Import fehlgeschlagen', 'danger');
    }
    setImporting(false);
  };

  const filteredScans = scans.filter(scan =>
    Object.values(scan).some(val => val?.toString().toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Body>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Alle Scans</h2>
        <div className="d-flex gap-2">

          {user?.id === 1 && (
            <Button
              variant="danger"
              onClick={() => setShowClearModal(true)}
              disabled={importing}
            >
              Alle Daten löschen
            </Button>
          )}

          {user?.id === 1 && (
            <Button variant="secondary" onClick={handleImportClick} disabled={importing}>Scans importieren</Button>
          )}
          <Button variant="success" onClick={() => setShowNewScanModal(true)} disabled={importing}>Scan</Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="Suche nach Scan, Ort, Zeit..."
        className="mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Erstellt am</th>
            <th>Beschreibung</th>
            <th>Dateiname</th>
            <th>Download</th>
            <th>Optionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredScans.map(scan => (
            <tr key={scan.id} onClick={(e) => !e.target.closest('button') && handleNavigate(scan.id)} style={{ cursor: 'pointer' }}>
              <td>{scan.id}</td>
              <td>{scan.created_at ? new Date(scan.created_at).toLocaleString() : '–'} (<TimeAgo isoDate={scan.created_at} />)</td>
              <td>{scan.description}</td>
              <td>{scan.filename}</td>
              <td>
                {scan.filename ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={e => { e.stopPropagation(); handleDownload(scan); }}
                  >
                    <FiDownload />
                  </Button>

                ) : '–'}
              </td>
              <td>
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClick(scan.id); }}>Löschen</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scan löschen</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bist du sicher, dass du diesen Scan löschen möchtest?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>Abbrechen</Button>
          <Button variant="danger" onClick={confirmDelete}>Löschen</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Datenbank löschen</Modal.Title>
        </Modal.Header>
        <Modal.Body>Möchtest du wirklich alle Scan-bezogenen Daten löschen?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>Abbrechen</Button>
          <Button variant="danger" onClick={handleClearDatabase}>Löschen</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showNewScanModal} onHide={() => setShowNewScanModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Neuen Scan starten</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newScan.name}
                onChange={(e) => setNewScan({ ...newScan, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control
                type="text"
                value={newScan.description}
                onChange={(e) => setNewScan({ ...newScan, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ort</Form.Label>
              <Form.Control
                type="text"
                value={newScan.location}
                onChange={(e) => setNewScan({ ...newScan, location: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer (Sekunden)</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <RangeSlider
                  value={infinite ? 600 : newScan.duration}
                  onChange={e => setNewScan({ ...newScan, duration: parseInt(e.target.value) })}
                  min={10} max={600} step={10}
                  disabled={infinite}
                  tooltip='off'
                />
                <Form.Check
                  type="checkbox"
                  label="Unendlich"
                  checked={infinite}
                  onChange={e => setInfinite(e.target.checked)}
                />
              </div>
              <div className="mt-2 fw-bold text-center">
                {infinite ? '∞ (unendlich)' : `${newScan.duration} Sekunden`}
              </div>
              <Form.Text className="text-muted">10 Sekunden bis 10 Minuten oder unendlich</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewScanModal(false)}>Abbrechen</Button>
          <Button variant="success" onClick={handleNewScanSubmit}>Scan starten</Button>
        </Modal.Footer>
      </Modal>
      {scanOutput && (
        <div className="mt-4">
          <h5>Scan-Ausgabe</h5>
          <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '0.5rem' }}>
            {scanOutput}
          </pre>
        </div>
      )}
    </Body>
  );
}
