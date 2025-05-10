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
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';
import TimeAgo from '../components/TimeAgo';
import { FiAlertTriangle, FiArrowUp, FiArrowDown, FiFilter, FiDownload, FiWifiOff, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { handleDownload, handleDownloadFile } from '../utils/download';
import { formatUtcDate } from '../utils/format';
import ScanHeader from '../components/ScanHeader';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

export default function ScanDetailPage() {
  const { id } = useParams();
  const scanId = parseInt(id, 10);
  const navigate = useNavigate();
  const api = useApi();
  const flash = useFlash();

  const [scan, setScan] = useState(null);
  const [openMap, setOpenMap] = useState({});

  // Sorting for access_points
  const [apSort, setApSort] = useState({ field: null, asc: true });

  // Deauth state
  const [showDeauthModal, setShowDeauthModal] = useState(false);
  const [selectedAp, setSelectedAp] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deauthOptions, setDeauthOptions] = useState({ packets: 10, duration: 30 });
  const [activeDeauths, setActiveDeauths] = useState({});
  const [handshakeFiles, setHandshakeFiles] = useState({});
  const [infinitePackets, setInfinitePackets] = useState(false);

  // Rescan state
  const [showRescanModal, setShowRescanModal] = useState(false);
  const [rescanBssid, setRescanBssid] = useState(null);
  const [rescanOptions, setRescanOptions] = useState({ description: '', duration: 30 });
  const [activeRescans, setActiveRescans] = useState({});
  const [rescanOutputs, setRescanOutputs] = useState({});
  const [rescanProgress, setRescanProgress] = useState(0);
  const [rescanStartTime, setRescanStartTime] = useState(null);
  const [rescanDurationState, setRescanDurationState] = useState(0);

  // Sorting state for Unlinked Clients
  const [unlinkedSort, setUnlinkedSort] = useState({ column: null, asc: true });

  // Load scan details on mount
  useEffect(() => {
    const load = async () => {
      const response = await api.get(`/scans/${scanId}`);
      if (response.ok) setScan(response.body);
      else flash(response.body?.error || 'Scan nicht gefunden', 'danger');
    };
    if (scanId) load();
  }, [scanId, api, flash]);

  // --- WICHTIG: Hier extrahieren wir nur den Dateinamen ---
  useEffect(() => {
    if (!scan) return;
    const hf = {};
    scan.access_points.forEach(ap => {
      if (ap.handshake_file) {
        hf[`${ap.bssid}|AP`] = ap.handshake_file.split('/').pop();
      }
      ap.clients.forEach(c => {
        if (c.handshake_file) {
          hf[`${ap.bssid}|${c.mac}`] = c.handshake_file.split('/').pop();
        }
      });
    });
    scan.unlinked_clients.forEach(c => {
      if (c.handshake_file) {
        hf[c.mac] = c.handshake_file.split('/').pop();
      }
    });
    setHandshakeFiles(hf);
  }, [scan]);

  // Track rescan progress
  useEffect(() => {
    if (rescanStartTime === null) return;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - rescanStartTime) / 1000;
      const pct = Math.min(100, (elapsed / rescanDurationState) * 100);
      setRescanProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [rescanStartTime, rescanDurationState]);

  const toggle = (bssid) => setOpenMap(prev => ({ ...prev, [bssid]: !prev[bssid] }));

  const sortedUnlinked = useMemo(() => {
    if (!scan) return [];
    const list = [...scan.unlinked_clients];
    const { column, asc } = unlinkedSort;
    if (!column) return list;
    return list.sort((a, b) => {
      let aVal = a[column] ?? '';
      let bVal = b[column] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return asc ? -1 : 1;
      if (aVal > bVal) return asc ? 1 : -1;
      return 0;
    });
  }, [scan, unlinkedSort]);

  const handleUnlinkedSort = (column) => setUnlinkedSort(prev => ({ column, asc: prev.column === column ? !prev.asc : true }));

  // Filter button handler
  const handleSortSelect = (field) => {
    setApSort(prev => ({
      field,
      asc: prev.field === field ? !prev.asc : true
    }));
  };

  // Sorted access_points
  const sortedAPs = useMemo(() => {
    if (!scan) return [];
    const list = [...scan.access_points];
    const { field, asc } = apSort;
    if (!field) return list;
    return list.sort((a, b) => {
      let av = a[field] ?? '';
      let bv = b[field] ?? '';
      if (field === 'last_seen') {
        av = a.last_seen ? new Date(a.last_seen).getTime() : 0;
        bv = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      }
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
  }, [scan, apSort]);

  // Deauth handlers
  const handleDeauthAp = (bssid) => {
    setSelectedAp(bssid);
    setSelectedClient(null);
    setShowDeauthModal(true);
  };

  const handleDeauthClient = (bssid, clientMac) => {
    setSelectedAp(bssid);
    setSelectedClient(clientMac);
    setShowDeauthModal(true);
  };

  const submitDeauth = async () => {
    setShowDeauthModal(false);
    flash('Deauth process started...', 'warning');
    const key = `${selectedAp}|${selectedClient || 'AP'}`;
    setActiveDeauths(prev => ({ ...prev, [key]: true }));

    const apInfo = scan.access_points.find(a => a.bssid === selectedAp) || {};
    const channel = apInfo.channel || 6;

    let endpoint, payload;
    if (selectedClient) {
      // Deauthentifiziere Client vom AP
      endpoint = '/deauth/start_deauth_client';
      payload = {
        scan_id: scanId,
        ap_mac: selectedAp,
        client_mac: selectedClient,
        channel: channel,
        packets: deauthOptions.packets,
        duration: deauthOptions.duration
      };
    } else {
      // Deauthentifiziere Access Point selbst
      endpoint = '/deauth/start';
      payload = {
        scan_id: scanId,
        mac: selectedAp,
        channel: channel,
        is_client: false,
        packets: deauthOptions.packets,
        duration: deauthOptions.duration
      };
    }

    const resp = await api.post(endpoint, payload);
    setActiveDeauths(prev => { const nxt = { ...prev }; delete nxt[key]; return nxt; });
    if (resp.ok) {
      flash(resp.body.message || 'Deauth abgeschlossen.', 'success');
      if (resp.body.file) setHandshakeFiles(prev => ({ ...prev, [key]: resp.body.file }));
    } else {
      flash(resp.body?.error || 'Deauth fehlgeschlagen.', 'danger');
    }
  };


  const renderDeauthStatus = (bssid, client) => {
    const key = `${bssid}|${client || 'AP'}`;
    return activeDeauths[key] ? <Spinner animation="border" size="sm" variant="danger" /> : null;
  };

  const renderHandshakeLink = (bssid, client) => {
    const key = `${bssid}|${client || 'AP'}`;
    const filename = handshakeFiles[key];
    if (!filename) return null;
    return (
      <Button
        variant="success"
        size="sm"
        className="ms-2 d-inline-flex align-items-center"
        onClick={e => {
          e.stopPropagation();
          handleDownloadFile(scanId, filename, api.base_url, flash);
        }}
      >
        <FiDownload className="me-1" />Handshake
      </Button>
    );
  };

  // Rescan handlers
  const handleRescan = (bssid) => {
    setRescanBssid(bssid);
    setRescanOptions({ description: '', duration: 60 });
    setRescanDurationState(60);
    setRescanProgress(0);
    setRescanStartTime(Date.now());
    setShowRescanModal(true);
  };
  const submitRescan = async () => {
    setShowRescanModal(false);
    flash('Rescan gestartet...', 'success');
    setActiveRescans(prev => ({ ...prev, [rescanBssid]: true }));

    // Update duration state from options
    setRescanDurationState(rescanOptions.duration);
    setRescanStartTime(Date.now());
    setRescanProgress(0);

    const resp = await api.post(`/scans/${scanId}/scan_ap`, { bssid: rescanBssid, channel: scan.access_points.find(ap => ap.bssid === rescanBssid)?.channel });
    setActiveRescans(prev => { const u = { ...prev }; delete u[rescanBssid]; return u; });
    if (resp.ok) {
      flash('Rescan abgeschlossen.', 'success');
      setRescanOutputs(prev => ({ ...prev, [rescanBssid]: resp.body.output }));
    } else {
      flash(resp.body?.error || 'Rescan fehlgeschlagen.', 'danger');
      setRescanOutputs(prev => ({ ...prev, [rescanBssid]: resp.body?.error || '' }));
    }
    // finalize progress
    setRescanProgress(100);
    setRescanStartTime(null);

    // reload data
    const reload = await api.get(`/scans/${scanId}`);
    if (reload.ok) setScan(reload.body);
  };

  if (!scan) return <Body><p>Lade Scan-Daten...</p></Body>;

  return (
    <Body>
      <Button variant="primary" className="mb-3" onClick={() => navigate('/scans')}>Übersicht</Button>
      <ScanHeader
        scan={scan}
        onDownload={() => handleDownload(scan, api.base_url, flash)}
      />
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h4>Access Points</h4>
        <Dropdown as={ButtonGroup}>
          <Button variant="outline-secondary" size="sm">
            <FiFilter /> Sortieren
          </Button>
          <Dropdown.Toggle split variant="outline-secondary" id="dropdown-split-basic" size="sm" />
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleSortSelect('power')}>
              Power {apSort.field === 'power' && (apSort.asc ? '↑' : '↓')}
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSortSelect('essid')}>
              SSID {apSort.field === 'essid' && (apSort.asc ? '↑' : '↓')}
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSortSelect('vendor')}>
              Vendor {apSort.field === 'vendor' && (apSort.asc ? '↑' : '↓')}
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSortSelect('last_seen')}>
              Last Seen {apSort.field === 'last_seen' && (apSort.asc ? '↑' : '↓')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>


      <hr />
      {sortedAPs.map(ap => {
        const hasCamClient = ap.clients.some(c => c.is_camera);
        return (
          <Card key={ap.bssid} className="mb-2">
            <Card.Header onClick={() => toggle(ap.bssid)} style={{ cursor: 'pointer' }}>
              <div className="d-flex justify-content-between align-items-center">
                {/* Name mit truncation nur auf kleineren Bildschirmen */}
                <div className="flex-grow-1 me-2" style={{ minWidth: 0 }}>
                  <strong className="ap-name">
                    {hasCamClient && <FiAlertTriangle className="text-warning ms-1" />}
                    {ap.essid || '<Hidden>'}
                  </strong>
                </div>
                <ButtonGroup className="d-flex gap-1 align-items-center flex-shrink-0">
                  {renderDeauthStatus(ap.bssid)}
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-fill ap-action-btn"
                    onClick={e => { e.stopPropagation(); handleDeauthAp(ap.bssid); }}
                  >
                    <FiWifiOff /> Deauth
                  </Button>
                  {handshakeFiles[`${ap.bssid}|AP`] && (
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-fill ap-action-btn"
                      onClick={e => {
                        e.stopPropagation();
                        const filename = handshakeFiles[`${ap.bssid}|AP`];
                        handleDownloadFile(
                          scanId,           // 1️⃣ Scan-ID
                          filename,         // 2️⃣ Dateiname
                          api.base_url,     // 3️⃣ baseUrl (z.B. '/api' oder vollständige URL)
                          flash             // 4️⃣ flash-Funktion
                        );
                      }}
                    >
                      Handshake
                    </Button>
                  )}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="flex-fill ap-action-btn"
                    disabled={activeRescans[ap.bssid]}
                    onClick={e => { e.stopPropagation(); handleRescan(ap.bssid); }}
                  >
                    <FiRefreshCw />
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="flex-fill ap-action-btn"
                    onClick={e => { e.stopPropagation(); toggle(ap.bssid); }}
                    title={openMap[ap.bssid] ? 'Details ausblenden' : 'Details anzeigen'}
                  >
                    {openMap[ap.bssid] ? <FiChevronUp /> : <FiChevronDown />}
                  </Button>
                </ButtonGroup>
              </div>
              {rescanBssid === ap.bssid && rescanStartTime !== null && (
                <ProgressBar
                  now={rescanProgress}
                  animated
                  striped
                  style={{
                    height: '4px',        // sehr flach
                    marginTop: '0.5rem',  // kleiner Abstand
                    borderRadius: '2px'
                  }}
                />
              )}
            </Card.Header>
            <Collapse in={openMap[ap.bssid]}>
              <Card.Body>
                <Card className="mb-3">
                  <Card.Body>
                    {rescanOutputs[ap.bssid] != null && (
                      <div className="mb-3">
                        <h6>Rescan Ausgabe:</h6>
                        <pre style={{ background: '#f1f1f1', padding: '0.5rem', borderRadius: '0.25rem' }}>
                          {rescanOutputs[ap.bssid]}
                        </pre>
                      </div>
                    )}



                    <Row className="gy-2">
                      <Col xs={12} md={6}>
                        <strong>SSID: </strong> {hasCamClient && <FiAlertTriangle className="text-warning ms-1" />}
                        {ap.essid || '<Hidden>'}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>BSSID:</strong> {ap.bssid}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Channel:</strong> {ap.channel}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>Vendor:</strong> {ap.vendor || '–'}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Camera:</strong> {ap.is_camera ? 'Yes' : 'No'}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>First Seen:</strong> {formatUtcDate(ap.first_seen)}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Last Seen:</strong> {formatUtcDate(ap.last_seen)}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>Speed:</strong> {ap.speed}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Privacy:</strong> {ap.privacy}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>Cipher:</strong> {ap.cipher}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Authentication:</strong> {ap.authentication}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>Power:</strong> {ap.power}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Beacons:</strong> {ap.beacons}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>IV:</strong> {ap.iv}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>LAN IP:</strong> {ap.lan_ip}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>ID-length:</strong> {ap.id_length}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Key:</strong> {ap.key || '–'}
                      </Col>

                      <Col xs={12} md={6}>
                        <strong>Clients:</strong> {ap.clients.length}
                      </Col>
                      <Col xs={12} md={6}>
                        <strong>Kameras:</strong> {ap.clients.filter(c => c.is_camera).length}
                      </Col>

                    </Row>
                    <hr />
                    <Row className="gy-2">
                      <Col xs={12} md={6}>
                        {/* Handshake-Download-Links unterhalb der Überschrift */}
                        {Object.entries(handshakeFiles)
                          .filter(([key]) => key.startsWith(`${ap.bssid}|`))
                          .map(([key, filename]) => (
                            <Button
                              key={key}
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={e => {
                                e.stopPropagation();
                                handleDownloadFile(scanId, filename, api.base_url, flash);
                              }}
                            > 
                              <FiDownload className="me-1" />
                              Handshake
                            </Button>
                          ))
                        }
                      </Col>
                    </Row>

                  </Card.Body>
                </Card>

                <hr />
                <h5>{ap.clients.length} Clients an {ap.essid || '<Hidden>'}</h5>

                {ap.clients.length === 0 ? <p>Keine Clients verbunden.</p> : (
                  <div className="d-flex flex-wrap">
                    {ap.clients.map(client => (
                      <Card key={client.mac} className="mb-2 w-100 w-md-50">
                        <Card.Body>
                          <ListGroup variant="flush">
                            <ListGroup.Item>
                              <strong>
                                {client.is_camera && <FiAlertTriangle className="text-warning" />} MAC:&nbsp;
                              </strong>
                              {client.mac || '–'}
                            </ListGroup.Item>
                            <ListGroup.Item><strong>Vendor:</strong> {client.vendor || '–'}</ListGroup.Item>
                            <ListGroup.Item><strong>Power:</strong> {client.power}</ListGroup.Item>
                            <ListGroup.Item><strong>First Seen:</strong> {formatUtcDate(client.first_seen)}</ListGroup.Item>
                            <ListGroup.Item><strong>Last Seen:</strong> {formatUtcDate(client.last_seen)}</ListGroup.Item>
                            <ListGroup.Item><strong>Probed ESSIDs:</strong> {client.probed_essids}</ListGroup.Item>
                            <ListGroup.Item className="d-flex align-items-center gap-2">
                              {(() => {
                                const key = `${ap.bssid}|${client.mac}`;
                                return (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={!!activeDeauths[key]}
                                    onClick={() => handleDeauthClient(ap.bssid, client.mac)}
                                  >
                                    <FiWifiOff /> Deauth
                                  </Button>
                                );
                              })()}
                              {/* Spinner beim Client-Deauth */}
                              {renderDeauthStatus(ap.bssid, client.mac)}
                              {renderHandshakeLink(ap.bssid, client.mac)}
                            </ListGroup.Item>
                          </ListGroup>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Collapse>
          </Card>
        );
      })}

      {scan.unlinked_clients.length > 0 && (
        <>
          <h4 className="mt-5">Clients ohne Access Point</h4>

          {/* Mobile cards */}
          <div className="d-block d-sm-none">
            {scan.unlinked_clients.map(client => (
              <Card key={client.mac} className="mb-2">
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between align-items-center">
                    <span className="text-monospace">{client.mac}</span>
                    {client.is_camera && <FiAlertTriangle className="text-warning" />}
                  </Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item><strong>Vendor:</strong> {client.vendor || '–'}</ListGroup.Item>
                    <ListGroup.Item><strong>Power:</strong> {client.power}</ListGroup.Item>
                    <ListGroup.Item>
                      <strong>First Seen:</strong><br />
                      <TimeAgo isoDate={client.first_seen} />
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Last Seen:</strong><br />
                      <TimeAgo isoDate={client.last_seen} />
                    </ListGroup.Item>
                    <ListGroup.Item><strong>Probed ESSIDs:</strong> {client.probed_essids}</ListGroup.Item>
                    <ListGroup.Item className="d-flex gap-2">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeauthClient(null, client.mac)}
                      >
                        Deauth
                      </Button>
                      {renderHandshakeLink(null, client.mac)}
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            ))}
          </div>

          {/* Desktop/tablet table */}
          <div className="d-none d-sm-block">
            <Table size="sm" striped bordered responsive>
              <thead>
                <tr>
                  <th onClick={() => handleUnlinkedSort('mac')} style={{ cursor: 'pointer' }}>
                    MAC {unlinkedSort.column === 'mac' && (unlinkedSort.asc ? <FiArrowUp /> : <FiArrowDown />)}
                  </th>
                  <th onClick={() => handleUnlinkedSort('vendor')} style={{ cursor: 'pointer' }}>
                    Vendor {unlinkedSort.column === 'vendor' && (unlinkedSort.asc ? <FiArrowUp /> : <FiArrowDown />)}
                  </th>
                  <th>Camera</th>
                  <th onClick={() => handleUnlinkedSort('power')} style={{ cursor: 'pointer' }}>
                    Power {unlinkedSort.column === 'power' && (unlinkedSort.asc ? <FiArrowUp /> : <FiArrowDown />)}
                  </th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                  <th>Probed ESSIDs</th>
                </tr>
              </thead>
              <tbody>
                {sortedUnlinked.map(client => (
                  <tr key={client.mac}>
                    <td className="text-monospace">{client.mac}</td>
                    <td>{client.vendor || '–'}</td>
                    <td>{client.is_camera ? <FiAlertTriangle className="text-warning" /> : 'No'}</td>
                    <td>{client.power}</td>
                    <td><TimeAgo isoDate={client.first_seen} /></td>
                    <td><TimeAgo isoDate={client.last_seen} /></td>
                    <td>{client.probed_essids}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {/* Deauth Modal */}
      <Modal show={showDeauthModal} onHide={() => setShowDeauthModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Deauth starten</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            {/* Pakete Slider */}
            <Form.Group className="mb-3">
              <Form.Label>Pakete ({infinitePackets ? '∞ unendlich' : deauthOptions.packets})</Form.Label>
              <RangeSlider
                min={1} max={100} step={1}
                value={deauthOptions.packets}
                onChange={e => setDeauthOptions(o => ({ ...o, packets: +e.target.value }))}
                disabled={infinitePackets}
                tooltip="off"
              />
              <Form.Check
                className="mt-2"
                type="checkbox"
                label="Unendlich"
                checked={infinitePackets}
                onChange={e => setInfinitePackets(e.target.checked)}
              />
            </Form.Group>

            {/* Dauer Slider */}
            <Form.Group className="mb-3">
              <Form.Label>Dauer ({deauthOptions.duration} Sekunden)</Form.Label>
              <RangeSlider
                min={10} max={600} step={1}
                value={deauthOptions.duration}
                onChange={e => setDeauthOptions(o => ({ ...o, duration: +e.target.value }))}
                tooltip="off"
              />
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
              <Form.Control
                type="text"
                value={rescanOptions.description}
                onChange={e => setRescanOptions(o => ({ ...o, description: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer ({rescanOptions.duration} Sekunden)</Form.Label>
              <RangeSlider
                min={1} max={300} step={1}
                value={rescanOptions.duration}
                onChange={e => setRescanOptions(o => ({ ...o, duration: +e.target.value }))}
                tooltip="off"
              />
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