import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Eye, EyeOff } from 'lucide-react';
import Body from '../components/Body';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';

export default function SettingsPage() {
  const api = useApi();
  const flash = useFlash();

  // Neue State für gespeicherte Konfiguration
  const [savedSetting, setSavedSetting] = useState({ ssid: '', force_connect: false });

  // Restliche States ...
  const [showModal, setShowModal] = useState(false);
  const [accessPoints, setAccessPoints] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedSSID, setSelectedSSID] = useState('');
  const [password, setPassword] = useState('');
  const [forceConnect, setForceConnect] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  const [wifiStatus, setWifiStatus] = useState({ connected: false, ssid: '', ip: '', gateway: '' });
  const [ethStatus, setEthStatus] = useState({ connected: false, ip: '', gateway: '' });
  const [autoconnectFailed, setAutoconnectFailed] = useState(false);
  const [failedSSID, setFailedSSID] = useState('');

  // Lade gespeicherte Einstellungen (GET /settings)
  useEffect(() => {
    (async () => {
      const res = await api.get('/settings');
      if (res.ok) {
        setSavedSetting(res.body);
      }
    })();
  }, [api]);

  // Lade WLAN- und Ethernet-Status
  useEffect(() => {
    const loadStatus = async () => {
      const res = await api.get('/wifi/status');
      if (res.ok) {
        const body = res.body;
        setWifiStatus({ connected: body.connected, ssid: body.ssid, ip: body.ip, gateway: body.gateway });
        if (body.autoconnect_failed) {
          setAutoconnectFailed(true);
          setFailedSSID(body.target_ssid || '');
        } else {
          setAutoconnectFailed(false);
          setFailedSSID('');
        }
      }
      const ethRes = await api.get('/ethernet/status');
      if (ethRes.ok) setEthStatus(ethRes.body);
    };
    loadStatus();
  }, [api]);

  // Access Points beim Modal-Öffnen laden
  useEffect(() => {
    if (showModal) {
      setScanning(true);
      (async () => {
        const res = await api.get('/wifi/scan');
        if (res.ok) setAccessPoints(res.body);
        setScanning(false);
      })();
    } else {
      // Reset state beim Schließen
      setAccessPoints([]);
      setSelectedSSID('');
      setPassword('');
      setForceConnect(savedSetting.force_connect); // default wieder vom gespeicherten Wert
      setShowPassword(false);
      setConnecting(false);
    }
  }, [showModal, api, savedSetting.force_connect]);

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnecting(true);
    const payload = { ssid: selectedSSID, password, force_connect: forceConnect ? 1 : 0 };
    try {
      const res = await api.post('/settings', payload);
      if (res.ok) {
        flash('WLAN-Einstellungen gespeichert', 'success');
        setShowModal(false);
        // gespeicherte Einstellungen aktualisieren
        setSavedSetting({ ssid: selectedSSID, force_connect: forceConnect });
        // Status erneuern
        const statusRes = await api.get('/wifi/status');
        if (statusRes.ok) {
          const body = statusRes.body;
          setWifiStatus({ connected: body.connected, ssid: body.ssid, ip: body.ip, gateway: body.gateway });
          setAutoconnectFailed(!!body.autoconnect_failed);
          setFailedSSID(body.target_ssid || '');
        }
      } else {
        flash('Fehler: ' + JSON.stringify(res.body), 'danger');
      }
    } catch (err) {
      flash('Netzwerkfehler beim Verbinden', 'danger');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const res = await api.post('/wifi/disconnect');
    if (res.ok) {
      flash(`Verbindung zu ${wifiStatus.ssid} getrennt`, 'success');
      setShowDisconnect(false);
      const wifiRes = await api.get('/wifi/status');
      if (wifiRes.ok) {
        setWifiStatus(wifiRes.body);
        setAutoconnectFailed(!!wifiRes.body.autoconnect_failed);
        setFailedSSID(wifiRes.body.target_ssid || '');
      }
    } else {
      flash('Fehler beim Trennen: ' + JSON.stringify(res.body), 'danger');
    }
  };

  return (
    <Body sidebar>
      <h2>Netzwerk-Einstellungen</h2>
      {autoconnectFailed && (
        <Alert variant="warning">
          Automatische Verbindung zu <strong>{failedSSID}</strong> fehlgeschlagen. Bitte wählen Sie ein anderes WLAN aus.
        </Alert>
      )}
      <div className="mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)} className="me-2">
          Mit WLAN verbinden
        </Button>
        {wifiStatus.connected && (
          <Button variant="warning" onClick={() => setShowDisconnect(true)}>
            WLAN trennen
          </Button>
        )}
      </div>

      {/* Connect Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>WLAN auswählen</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleConnect}>
          <Modal.Body>
            {/* Inline Feedback beim Verbinden */}
            {connecting && selectedSSID && (
              <Alert variant="info" className="mb-3">
                Verbindung zu <strong>{selectedSSID}</strong> wird hergestellt... bitte warten.
              </Alert>
            )}
            <Form.Group>
              <Form.Label>
                Verfügbare Netzwerke{' '}
                {scanning && <Spinner animation="border" size="sm" className="ms-2" />}
              </Form.Label>
              <Form.Select
                value={selectedSSID}
                onChange={e => setSelectedSSID(e.target.value)}
                required
                disabled={scanning || connecting}
              >
                {scanning ? (
                  <option>Scanne WLANs… bitte warten</option>
                ) : (
                  <>
                    <option value="">– bitte wählen –</option>
                    {accessPoints.map(ap => (
                      <option key={ap.ssid} value={ap.ssid}>
                        {ap.ssid} ({ap.strength}%)
                      </option>
                    ))}
                  </>
                )}
              </Form.Select>
            </Form.Group>
            {selectedSSID && !scanning && (
              <>
                <Form.Group className="mt-3">
                  <Form.Label>Passwort</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={connecting}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={connecting}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Check
                    type="checkbox"
                    label="Automatisch verbinden (force_connect)"
                    checked={forceConnect}
                    onChange={e => setForceConnect(e.target.checked)}
                    disabled={connecting}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={connecting}>
              Abbrechen
            </Button>
            <Button variant="primary" type="submit" disabled={!selectedSSID || scanning || connecting}>
              {connecting ? <><Spinner animation="border" size="sm" className="me-2"/>Verbinden…</> : 'Verbinden & Speichern'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Disconnect Confirmation */}
      <Modal show={showDisconnect} onHide={() => setShowDisconnect(false)}>
        <Modal.Header closeButton>
          <Modal.Title>WLAN trennen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchten Sie die Verbindung zu <strong>{wifiStatus.ssid}</strong> trennen?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDisconnect(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={handleDisconnect}>
            Trennen
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Netzwerk-Status Cards */}
      <h3 className="mt-4">Aktueller Netzwerk-Status</h3>
      <Row>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Header>WLAN (wlan0)</Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><strong>Verbunden:</strong> {wifiStatus.connected ? 'Ja' : 'Nein'}</ListGroup.Item>
              <ListGroup.Item><strong>SSID:</strong> {wifiStatus.ssid || '–'}</ListGroup.Item>
              <ListGroup.Item><strong>IP-Adresse:</strong> {wifiStatus.ip || '–'}</ListGroup.Item>
              <ListGroup.Item><strong>Gateway:</strong> {wifiStatus.gateway || '–'}</ListGroup.Item>
              <ListGroup.Item><strong>Automatisch verbinden:</strong> {savedSetting.force_connect ? 'Ja' : 'Nein'}</ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Header>Ethernet (eth0)</Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item><strong>Verbunden:</strong> {ethStatus.connected ? 'Ja' : 'Nein'}</ListGroup.Item>
              <ListGroup.Item><strong>IP-Adresse:</strong> {ethStatus.ip || '–'}</ListGroup.Item>
              <ListGroup.Item><strong>Gateway:</strong> {ethStatus.gateway || '–'}</ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Body>
  );
}
