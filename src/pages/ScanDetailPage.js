import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { FiDownload, FiAlertTriangle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { handleDownload } from '../utils/download';

export default function ScanDetailPage() {
  const { id } = useParams();
  const scanId = parseInt(id, 10);
  const navigate = useNavigate();
  const api = useApi();
  const flash = useFlash();

  const [scan, setScan] = useState(null);
  const [openMap, setOpenMap] = useState({});

  // Deauth state
  const [showDeauthModal, setShowDeauthModal] = useState(false);
  const [selectedMac, setSelectedMac] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [deauthOptions, setDeauthOptions] = useState({ packets: 10, duration: 60 });
  const [activeDeauths, setActiveDeauths] = useState({});
  const [handshakeFiles, setHandshakeFiles] = useState({});

  // Rescan state
  const [showRescanModal, setShowRescanModal] = useState(false);
  const [rescanBssid, setRescanBssid] = useState(null);
  const [rescanOptions, setRescanOptions] = useState({ description: '', duration: 60 });

  // Sorting state for Unlinked Clients
  const [unlinkedSort, setUnlinkedSort] = useState({ column: null, asc: true });

  useEffect(() => {
    const load = async () => {
      const response = await api.get(`/scans/${scanId}`);
      if (response.ok) setScan(response.body);
      else flash(response.body?.error || 'Scan nicht gefunden', 'danger');
    };
    if (scanId) load();
  }, [scanId, api, flash]);

  const toggle = (bssid) => {
    setOpenMap(prev => ({ ...prev, [bssid]: !prev[bssid] }));
  };

  const sortedUnlinked = useMemo(() => {
    if (!scan) return [];
    const clients = [...scan.unlinked_clients];
    const { column, asc } = unlinkedSort;
    if (!column) return clients;
    return clients.sort((a, b) => {
      let valA = a[column] ?? '';
      let valB = b[column] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  }, [scan, unlinkedSort]);

  const handleUnlinkedSort = (column) => {
    setUnlinkedSort(prev => ({
      column,
      asc: prev.column === column ? !prev.asc : true
    }));
  };

  // Deauth handlers
  const handleDeauth = (mac, client = false) => {
    setSelectedMac(mac);
    setIsClient(client);
    setShowDeauthModal(true);
  };
  const submitDeauth = async () => {
    setShowDeauthModal(false);
    flash('Deauth process started...', 'warning');
    setActiveDeauths(prev => ({ ...prev, [selectedMac]: true }));

    const resp = await api.post('/deauth/start', { mac: selectedMac, is_client: isClient, ...deauthOptions, scan_id: scanId });
    setActiveDeauths(prev => { const u = { ...prev }; delete u[selectedMac]; return u; });
    if (resp.ok) {
      flash(resp.body.message || 'Deauth abgeschlossen.', 'success');
      if (resp.body.success && resp.body.file) setHandshakeFiles(prev => ({ ...prev, [selectedMac]: resp.body.file }));
    } else {
      flash(resp.body?.error || 'Deauth fehlgeschlagen.', 'danger');
    }
  };
  const renderDeauthStatus = mac => activeDeauths[mac] ? <Spinner animation="border" size="sm" variant="danger" /> : null;
  const renderHandshakeLink = mac => handshakeFiles[mac] && (
    <a href={`/scans/${handshakeFiles[mac]}`} target="_blank" rel="noopener noreferrer" className="ms-2 btn btn-sm btn-outline-success">Handshake</a>
  );

  // Rescan handlers
  const handleRescan = (bssid) => {
    setRescanBssid(bssid);
    setRescanOptions({ description: '', duration: 60 });
    setShowRescanModal(true);
  };
  const submitRescan = async () => {
    setShowRescanModal(false);
    flash('Rescan gestartet...', 'info');
    const resp = await api.post('/scan/rescan', { bssid: rescanBssid, ...rescanOptions });
    if (resp.ok) flash('Rescan abgeschlossen.', 'success');
    else flash(resp.body?.error || 'Rescan fehlgeschlagen.', 'danger');
    // optional: reload detail
    const reload = await api.get(`/scans/${scanId}`);
    if (reload.ok) setScan(reload.body);
  };

  if (!scan) return <Body><p>Lade Scan-Daten...</p></Body>;

  return (
    <Body>
      <Button variant="primary" className="mb-3" onClick={() => navigate('/scans')}>Übersicht</Button>
      <Card className="mb-4">
        <Card.Header>
          <strong>Scan:</strong> {scan.created_at ? new Date(scan.created_at).toLocaleString('de-DE') : '–'}{' '}
          {scan.created_at && <TimeAgo isoDate={scan.created_at} />}
        </Card.Header>
        <Card.Body>
          <p><strong>Beschreibung:</strong> {scan.description || '–'}</p>
          <p>
            <strong>Dateiname:</strong>{' '}
            {scan.filename ? (
              <>
                {scan.filename}{' '}
                <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); handleDownload(scan); }}>
                  Download <FiDownload />
                </Button>
              </>
            ) : ('–')}
          </p>
        </Card.Body>
      </Card>

      <hr />

      <h4 className="mt-4">Access Points</h4>
      {scan.access_points.map(ap => {
        const hasCamClient = ap.clients.some(c => c.is_camera);
        return (
          <Card key={ap.bssid} className="mb-2">
            <Card.Header onClick={() => toggle(ap.bssid)} style={{ cursor: 'pointer' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>
                    {ap.essid || '<Hidden>'}
                    {hasCamClient && <FiAlertTriangle className="text-warning ms-2" />}
                  </strong>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  {renderDeauthStatus(ap.bssid)}
                  <Button variant="danger" size="sm" onClick={e => { e.stopPropagation(); handleDeauth(ap.bssid); }}>Deauth AP</Button>
                  {renderHandshakeLink(ap.bssid)}
                  <Button variant="outline-secondary" size="sm" onClick={e => { e.stopPropagation(); handleRescan(ap.bssid); }}>Rescan AP</Button>
                  <Button variant="outline-primary" size="sm" onClick={e => { e.stopPropagation(); toggle(ap.bssid); }}>
                    {openMap[ap.bssid] ? 'Verbergen' : 'Details'}
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Collapse in={openMap[ap.bssid]}>
              <Card.Body>
                <Card className="mb-3">
                  <Card.Body>
                    <h5>
                      Access Point Informationen
                      {hasCamClient && <FiAlertTriangle className="text-warning ms-2" />}
                    </h5>
                    <Table size="sm" borderless className="mb-0">
                      <tbody>
                        <tr>
                          <td><strong>BSSID:</strong></td>
                          <td>{ap.bssid}</td>
                          <td><strong>Channel:</strong></td>
                          <td>{ap.channel}</td>
                        </tr>
                        <tr>
                          <td><strong>Vendor:</strong></td>
                          <td>{ap.vendor || '–'}</td>
                          <td><strong>Camera:</strong></td>
                          <td>
                            {ap.is_camera
                              ? <><FiAlertTriangle className="text-warning me-1" />Detected</>
                              : 'No'}
                          </td>
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
                        <th>Vendor</th>
                        <th>Camera</th>
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
                          <td>{client.vendor || '–'}</td>
                          <td>
                            {client.is_camera
                              ? <><FiAlertTriangle className="text-warning me-1" />Detected</>
                              : 'No'}
                          </td>
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
        );
      })}

      {scan.unlinked_clients.length > 0 && (
        <>
          <h4 className="mt-5">Clients ohne Access Point</h4>
          <Table size="sm" striped bordered>
            <thead>
              <tr>
                {['mac', 'vendor', 'is_camera', 'power', 'first_seen', 'last_seen', 'probed_essids'].map(col => (
                  <th key={col} onClick={() => handleUnlinkedSort(col)} style={{ cursor: 'pointer' }}>
                    {col === 'mac' && 'MAC'}
                    {col === 'vendor' && 'Vendor'}
                    {col === 'is_camera' && 'Camera'}
                    {col === 'power' && 'Power'}
                    {col === 'first_seen' && 'First Seen'}
                    {col === 'last_seen' && 'Last Seen'}
                    {col === 'probed_essids' && 'Probed ESSIDs'}
                    {unlinkedSort.column === col && (
                      unlinkedSort.asc ? <FiArrowUp className="ms-1" /> : <FiArrowDown className="ms-1" />
                    )}
                  </th>
                ))}
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {sortedUnlinked.map(client => (
                <tr key={client.mac}>
                  <td>{client.mac}</td>
                  <td>{client.vendor || '–'}</td>
                  <td>{client.is_camera
                    ? <><FiAlertTriangle className="text-warning me-1" title="Kamera erkannt" />Detected</>
                    : 'No'}</td>
                  <td>{client.power}</td>
                  <td>{client.first_seen ? new Date(client.first_seen).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'} (<TimeAgo isoDate={client.first_seen} />)</td>
                  <td>{client.last_seen ? new Date(client.last_seen).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'} (<TimeAgo isoDate={client.last_seen} />)</td>
                  <td>{client.probed_essids}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeauth(client.mac, true)}>Deauth</Button>
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

      {/* Deauth Modal */}
      <Modal show={showDeauthModal} onHide={() => setShowDeauthModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Deauth starten</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Anzahl Pakete</Form.Label>
              <Form.Control type="number" min={1} value={deauthOptions.packets} onChange={e => setDeauthOptions(o => ({ ...o, packets: +e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer (Sek.)</Form.Label>
              <Form.Control type="number" min={1} value={deauthOptions.duration} onChange={e => setDeauthOptions(o => ({ ...o, duration: +e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeauthModal(false)}>Abbrechen</Button>
          <Button variant="danger" onClick={submitDeauth}>Deauth starten</Button>
        </Modal.Footer>
      </Modal>

      {/* Rescan Modal */}
      <Modal show={showRescanModal} onHide={() => setShowRescanModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Rescan Access Point</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control type="text" value={rescanOptions.description} onChange={e => setRescanOptions(o => ({ ...o, description: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer (Sek.)</Form.Label>
              <Form.Control type="number" min={1} value={rescanOptions.duration} onChange={e => setRescanOptions(o => ({ ...o, duration: +e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRescanModal(false)}>Abbrechen</Button>
          <Button variant="success" onClick={submitRescan}>Rescan starten</Button>
        </Modal.Footer>
      </Modal>
    </Body>
  );
}
