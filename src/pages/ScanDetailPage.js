import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Body from '../components/Body';
import Card from 'react-bootstrap/Card';
import Collapse from 'react-bootstrap/Collapse';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';
import TimeAgo from '../components/TimeAgo';

export default function ScanDetailPage() {
  const { id } = useParams();
  const scanId = parseInt(id, 10);
  const api = useApi();
  const flash = useFlash();
  const [scan, setScan] = useState(null);
  const [openMap, setOpenMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedMac, setSelectedMac] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [deauthOptions, setDeauthOptions] = useState({ packets: 10, duration: 60 });
  const [activeDeauths, setActiveDeauths] = useState({});
  const [handshakeFiles, setHandshakeFiles] = useState({});

  useEffect(() => {
    if (!scanId) {
      console.warn('❌ Ungültige oder fehlende Scan-ID aus useParams():', id);
      return;
    }

    const load = async () => {
      console.log('📡 Lade Scan-Daten mit ID:', scanId);
      const response = await api.get(`/scans/${scanId}`);
      if (response.ok) {
        setScan(response.body);
      } else {
        flash(response.body?.error || 'Scan nicht gefunden', 'danger');
      }
    };
    load();
  }, [scanId, api, flash, id]);

  const toggle = (bssid) => {
    setOpenMap((prev) => ({ ...prev, [bssid]: !prev[bssid] }));
  };

  const handleDeauth = (mac, client = false) => {
    setSelectedMac(mac);
    setIsClient(client);
    setShowModal(true);
  };

  const submitDeauth = async () => {
    setShowModal(false);
    flash('Deauth process started...', 'warning');
    setActiveDeauths((prev) => ({ ...prev, [selectedMac]: true }));

    const response = await api.post('/deauth/start', {
      mac: selectedMac,
      is_client: isClient,
      packets: deauthOptions.packets,
      duration: deauthOptions.duration,
      scan_id: scanId
    });

    setActiveDeauths((prev) => {
      const updated = { ...prev };
      delete updated[selectedMac];
      return updated;
    });

    if (response.ok) {
      flash(response.body.message || 'Deauth abgeschlossen.', 'success');
      if (response.body.success && response.body.file) {
        setHandshakeFiles((prev) => ({ ...prev, [selectedMac]: response.body.file }));
      }
    } else {
      flash(response.body?.error || 'Deauth fehlgeschlagen.', 'danger');
    }
  };

  if (!scan) return <Body sidebar><p>Lade Scan-Daten...</p></Body>;

  const renderDeauthStatus = (mac) => (
    activeDeauths[mac] ? <Spinner animation="border" size="sm" variant="danger" /> : null
  );

  const renderHandshakeLink = (mac) => (
    handshakeFiles[mac] ? (
      <a
        href={`/scans/${handshakeFiles[mac]}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ms-2 btn btn-sm btn-outline-success"
      >
        Handshake
      </a>
    ) : null
  );

  return (
    <Body sidebar>
      <h2>Scan: {scan.filename}</h2>
      <p><strong>Beschreibung:</strong> {scan.description || '–'}</p>

      <h4 className="mt-4">Access Points</h4>
      {scan.access_points.map(ap => (
        <Card key={ap.bssid} className="mb-2">
          <Card.Header onClick={() => toggle(ap.bssid)} style={{ cursor: 'pointer' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{ap.essid || '<Hidden>'}</strong>
              </div>
              <div className="d-flex gap-2 align-items-center">
                {renderDeauthStatus(ap.bssid)}
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeauth(ap.bssid, false); }}>Deauth AP</Button>
                {renderHandshakeLink(ap.bssid)}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); toggle(ap.bssid); }}
                  aria-controls={`collapse-${ap.bssid}`}
                  aria-expanded={openMap[ap.bssid]}
                >
                  {openMap[ap.bssid] ? 'Verbergen' : 'Details'}
                </Button>
              </div>
            </div>
          </Card.Header>
          <Collapse in={openMap[ap.bssid]}>
            <Card.Body>
              <Card className="mb-3">
                <Card.Body>
                  <h5>Access Point Informationen</h5>
                  <Table size="sm" borderless className="mb-0">
                    <tbody>
                      <tr>
                        <td><strong>BSSID:</strong></td>
                        <td>{ap.bssid}</td>
                        <td><strong>Channel:</strong></td>
                        <td>{ap.channel}</td>
                      </tr>
                      <tr>
                        <td><strong>First Seen:</strong></td>
                        <td>{ap.first_seen ? new Date(ap.first_seen).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '–'} (<TimeAgo isoDate={ap.first_seen} />)</td>
                        <td><strong>Last Seen:</strong></td>
                        <td>{ap.last_seen ? new Date(ap.last_seen).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '–'} (<TimeAgo isoDate={ap.last_seen} />)</td>
                      </tr>
                      <tr>
                        <td><strong>Speed:</strong></td>
                        <td>{ap.speed}</td>
                        <td><strong>Privacy:</strong></td>
                        <td>{ap.privacy}</td>
                      </tr>
                      <tr>
                        <td><strong>Cipher:</strong></td>
                        <td>{ap.cipher}</td>
                        <td><strong>Authentication:</strong></td>
                        <td>{ap.authentication}</td>
                      </tr>
                      <tr>
                        <td><strong>Power:</strong></td>
                        <td>{ap.power}</td>
                        <td><strong>Beacons:</strong></td>
                        <td>{ap.beacons}</td>
                      </tr>
                      <tr>
                        <td><strong>IV:</strong></td>
                        <td>{ap.iv}</td>
                        <td><strong>LAN IP:</strong></td>
                        <td>{ap.lan_ip}</td>
                      </tr>
                      <tr>
                        <td><strong>ID-length:</strong></td>
                        <td>{ap.id_length}</td>
                        <td><strong>Key:</strong></td>
                        <td>{ap.key || '–'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {ap.clients.length === 0 ? <p>Keine Clients verbunden.</p> : (
                <Table size="sm" striped bordered>
                  <thead>
                    <tr>
                      <th>MAC</th>
                      <th>Power</th>
                      <th>First Seen</th>
                      <th>Last Seen</th>
                      <th>Probed ESSIDs</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ap.clients.map(client => (
                      <tr key={client.mac}>
                        <td>{client.mac}</td>
                        <td>{client.power}</td>
                        <td>{client.first_seen ? new Date(client.first_seen).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '–'} (<TimeAgo isoDate={client.first_seen} />)</td>
                        <td>{client.last_seen ? new Date(client.last_seen).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '–'} (<TimeAgo isoDate={client.last_seen} />)</td>
                        <td>{client.probed_essids}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeauth(client.mac, true)}>
                              Deauth
                            </Button>
                            {renderDeauthStatus(client.mac)}
                            {renderHandshakeLink(client.mac)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Collapse>
        </Card>
      ))}

      {scan.unlinked_clients.length > 0 && (
        <>
          <h4 className="mt-5">Clients ohne Access Point</h4>
          <Table size="sm" striped bordered>
            <thead>
              <tr>
                <th>MAC</th>
                <th>Power</th>
                <th>First Seen</th>
                <th>Last Seen</th>
                <th>Probed ESSIDs</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {scan.unlinked_clients.map(client => (
                <tr key={client.mac}>
                  <td>{client.mac}</td>
                  <td>{client.power}</td>
                  <td>{client.first_seen ? new Date(client.first_seen).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '–'} (<TimeAgo isoDate={client.first_seen} />)</td>
                  <td>{client.last_seen ? new Date(client.last_seen).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '–'} (<TimeAgo isoDate={client.last_seen} />)</td>
                  <td>{client.probed_essids}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeauth(client.mac, true)}>
                        Deauth
                      </Button>
                      {renderDeauthStatus(client.mac)}
                      {renderHandshakeLink(client.mac)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Deauth starten</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Anzahl Pakete</Form.Label>
              <Form.Control type="number" min={1} max={9999} value={deauthOptions.packets} onChange={e => setDeauthOptions({ ...deauthOptions, packets: parseInt(e.target.value) })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer (Sekunden)</Form.Label>
              <Form.Control type="number" min={10} max={600} value={deauthOptions.duration} onChange={e => setDeauthOptions({ ...deauthOptions, duration: parseInt(e.target.value) })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Abbrechen</Button>
          <Button variant="danger" onClick={submitDeauth}>Deauth starten</Button>
        </Modal.Footer>
      </Modal>
    </Body>
  );
}
