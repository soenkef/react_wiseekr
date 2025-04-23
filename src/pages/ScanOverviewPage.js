import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Body from '../components/Body';
import { useNavigate } from 'react-router-dom';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import { useFlash } from '../contexts/FlashProvider';
import { useApi } from '../contexts/ApiProvider';

const initialScans = [
  {
    id: 1,
    name: "Scan Café Mitte",
    description: "Vormittag Testlauf",
    location: "Berlin Mitte",
    timestamp: "2025-04-20 10:12",
    aps: 14,
    clients: 26
  },
  {
    id: 2,
    name: "Uni-Netz Gebäude B",
    description: "Routine Scan",
    location: "Campus Süd",
    timestamp: "2025-04-21 09:47",
    aps: 8,
    clients: 13
  },
  {
    id: 3,
    name: "Home-WiFi Test",
    description: "Wohnung 5 GHz Test",
    location: "Zuhause",
    timestamp: "2025-04-18 18:30",
    aps: 3,
    clients: 5
  }
];

export default function ScanOverviewPage() {
  const [search, setSearch] = useState('');
  const [scans, setScans] = useState(initialScans);
  const [showModal, setShowModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const [newScan, setNewScan] = useState({ name: '', description: '', location: '', duration: 60 });
  const [scanOutput, setScanOutput] = useState('');
  const navigate = useNavigate();
  const flash = useFlash();
  const api = useApi();
  
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

  const handleNavigate = (id) => {
    if (scans.find(scan => scan.id === id)) {
      navigate(`/scan/${id}`);
    }
  };

  const handleNewScanSubmit = async () => {

    const newId = scans.length + 1;
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const duration = infinite ? 600 : newScan.duration;

    setScans([...scans, { id: newId, timestamp, aps: 0, clients: 0, ...newScan, duration }]);
    setShowNewScanModal(false);
    flash('Scan wurde gestartet. Bitte hab Geduld.', 'success');
    setNewScan({ name: '', description: '', location: '', duration: 60 });
    setInfinite(false);

    try {
      const response = await api.post('/scan/start', { duration });
      if (response.ok) {
        setScanOutput(response.body.output || response.body.error || 'Kein Ergebnis erhalten.');
      } else {
        setScanOutput(response.body?.error || 'Unbekannter Fehler beim Scan.');
      }
    } catch (error) {
      setScanOutput('Fehler beim Abrufen des Scan-Ergebnisses.');
    }
  };

  const filteredScans = scans.filter(scan =>
    Object.values(scan).some(val =>
      val?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Body sidebar>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Alle Scans</h2>
        <Button variant="success" onClick={() => setShowNewScanModal(true)}>Scan</Button>
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
            <th>Name</th>
            <th>Beschreibung</th>
            <th>Ort</th>
            <th>Zeitpunkt</th>
            <th>Access Points</th>
            <th>Clients</th>
            <th>Optionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredScans.map(scan => (
            <tr key={scan.id}>
              <td>{scan.name}</td>
              <td>{scan.description}</td>
              <td>{scan.location}</td>
              <td>{scan.timestamp}</td>
              <td>{scan.aps}</td>
              <td>{scan.clients}</td>
              <td>
                <Button variant="primary" size="sm" onClick={() => handleNavigate(scan.id)}>
                  Details
                </Button>{' '}
                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(scan.id)}>
                  Löschen
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {scanOutput && (
        <div className="mt-4">
          <h5>Scan-Ausgabe</h5>
          <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '0.5rem' }}>{scanOutput}</pre>
        </div>
      )}

      {/* Modal: Scan löschen */}
      <Modal show={showModal} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scan löschen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bist du sicher, dass du diesen Scan löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>Abbrechen</Button>
          <Button variant="danger" onClick={confirmDelete}>Löschen</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Scan starten */}
      <Modal show={showNewScanModal} onHide={() => setShowNewScanModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Neuen Scan starten</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={newScan.name} onChange={(e) => setNewScan({...newScan, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control type="text" value={newScan.description} onChange={(e) => setNewScan({...newScan, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ort</Form.Label>
              <Form.Control type="text" value={newScan.location} onChange={(e) => setNewScan({...newScan, location: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer (Sekunden)</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <RangeSlider
                  value={infinite ? 600 : newScan.duration}
                  onChange={e => setNewScan({...newScan, duration: parseInt(e.target.value)})}
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
    </Body>
  );
}
