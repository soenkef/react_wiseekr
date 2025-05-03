import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { Eye, EyeOff } from 'lucide-react';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';

export default function WifiConnectSection({ savedSetting, onSavedSettingChange }) {
  const api = useApi();
  const flash = useFlash();

  // States für WLAN
  const [wifiStatus, setWifiStatus] = useState({ connected: false, ssid: '', ip: '', gateway: '' });
  const [accessPoints, setAccessPoints] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedSSID, setSelectedSSID] = useState('');
  const [password, setPassword] = useState('');
  const [forceConnect, setForceConnect] = useState(savedSetting.force_connect);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [autoconnectFailed, setAutoconnectFailed] = useState(false);
  const [failedSSID, setFailedSSID] = useState('');

  // States für Ethernet
  const [ethStatus, setEthStatus] = useState({ connected: false, ip: '', gateway: '' });

  // Load WLAN & Ethernet status
  useEffect(() => {
    (async () => {
      // WLAN status
      const wres = await api.get('/wifi/status');
      if (wres.ok) {
        const { connected, ssid, ip, gateway, autoconnect_failed, target_ssid } = wres.body;
        setWifiStatus({ connected, ssid, ip, gateway });
        setAutoconnectFailed(!!autoconnect_failed);
        setFailedSSID(target_ssid || '');
      }
      // Ethernet status
      const eres = await api.get('/ethernet/status');
      if (eres.ok) {
        setEthStatus(eres.body);
      }
    })();
  }, [api]);

  // Fetch APs when modal opens
  useEffect(() => {
    if (showModal) {
      setScanning(true);
      (async () => {
        const res = await api.get('/wifi/scan');
        if (res.ok) setAccessPoints(res.body);
        setScanning(false);
      })();
    } else {
      // reset modal inputs
      setSelectedSSID('');
      setPassword('');
      setForceConnect(savedSetting.force_connect);
      setShowPassword(false);
      setConnecting(false);
    }
  }, [showModal, api, savedSetting.force_connect]);

  const handleConnect = async e => {
    e.preventDefault();
    setConnecting(true);
    const payload = { ssid: selectedSSID, password, force_connect: forceConnect ? 1 : 0 };
    try {
      const res = await api.post('/settings', payload);
      if (res.ok) {
        flash('WLAN-Einstellungen gespeichert', 'success');
        onSavedSettingChange({ ssid: selectedSSID, force_connect: forceConnect });
        setShowModal(false);
        // reload status
        const statusRes = await api.get('/wifi/status');
        if (statusRes.ok) {
          const b = statusRes.body;
          setWifiStatus({ connected: b.connected, ssid: b.ssid, ip: b.ip, gateway: b.gateway });
          setAutoconnectFailed(!!b.autoconnect_failed);
          setFailedSSID(b.target_ssid || '');
        }
      } else {
        flash('Fehler: ' + JSON.stringify(res.body), 'danger');
      }
    } catch {
      flash('Netzwerkfehler beim Verbinden', 'danger');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const res = await api.post('/wifi/disconnect');
    if (res.ok) {
      flash(`Verbindung zu ${wifiStatus.ssid} getrennt`, 'success');
      onSavedSettingChange({ ssid: '', force_connect: false });
      setShowDisconnect(false);
      // reload statuses
      const [wres, eres] = await Promise.all([
        api.get('/wifi/status'),
        api.get('/ethernet/status')
      ]);
      if (wres.ok) setWifiStatus(wres.body);
      if (eres.ok) setEthStatus(eres.body);
      setAutoconnectFailed(false);
      setFailedSSID('');
    } else {
      flash('Fehler beim Trennen: ' + JSON.stringify(res.body), 'danger');
    }
  };

  return (
    <>
      {autoconnectFailed && (
        <Alert variant="warning">
          Automatische Verbindung zu <strong>{failedSSID}</strong> fehlgeschlagen.
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>WLAN auswählen</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleConnect}>
          <Modal.Body>
            {connecting && selectedSSID && (
              <Alert variant="info">
                Verbindung zu <strong>{selectedSSID}</strong> wird hergestellt…
              </Alert>
            )}
            <Form.Group>
              <Form.Label>
                Verfügbare Netzwerke{' '}
                {scanning && <Spinner animation="border" size="sm" />}
              </Form.Label>
              <Form.Select
                value={selectedSSID}
                onChange={e => setSelectedSSID(e.target.value)}
                disabled={scanning || connecting}
                required
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
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mt-2">
                  <Form.Check
                    type="checkbox"
                    label="Automatisch verbinden"
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
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedSSID || scanning || connecting}
            >
              {connecting ? (
                <><Spinner animation="border" size="sm" className="me-2" />Verbinden…</>
              ) : (
                'Verbinden & Speichern'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDisconnect} onHide={() => setShowDisconnect(false)}>
        <Modal.Header closeButton>
          <Modal.Title>WLAN trennen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchten Sie <strong>{wifiStatus.ssid}</strong> trennen?
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

      {/* Anzeige WLAN und Ethernet */}
      <h3>Netzwerkstatus</h3>
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
    </>
  );
}