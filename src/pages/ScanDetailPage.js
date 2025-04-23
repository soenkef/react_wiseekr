import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Body from '../components/Body';
import Card from 'react-bootstrap/Card';
import Collapse from 'react-bootstrap/Collapse';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';

export default function ScanDetailPage() {
  const { id } = useParams();
  const scanId = parseInt(id, 10);
  const api = useApi();
  const flash = useFlash();
  const [scan, setScan] = useState(null);
  const [openMap, setOpenMap] = useState({});

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

  if (!scan) return <Body sidebar><p>Lade Scan-Daten...</p></Body>;

  return (
    <Body sidebar>
      <h2>Scan: {scan.filename}</h2>
      <p><strong>Beschreibung:</strong> {scan.description || '–'}</p>

      <h4 className="mt-4">Access Points</h4>
      {scan.access_points.map(ap => (
        <Card key={ap.bssid} className="mb-2">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{ap.essid || '<Hidden>'}</strong> <small>({ap.bssid})</small> — Kanal {ap.channel}
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => toggle(ap.bssid)}
                aria-controls={`collapse-${ap.bssid}`}
                aria-expanded={openMap[ap.bssid]}
              >
                {openMap[ap.bssid] ? 'Verbergen' : 'Details'}
              </Button>
            </div>
          </Card.Header>
          <Collapse in={openMap[ap.bssid]}>
            <Card.Body>
              {ap.clients.length === 0 ? <p>Keine Clients verbunden.</p> : (
                <Table size="sm" striped bordered>
                  <thead>
                    <tr>
                      <th>MAC</th>
                      <th>Power</th>
                      <th>First Seen</th>
                      <th>Last Seen</th>
                      <th>Probed ESSIDs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ap.clients.map(client => (
                      <tr key={client.mac}>
                        <td>{client.mac}</td>
                        <td>{client.power}</td>
                        <td>{client.first_seen}</td>
                        <td>{client.last_seen}</td>
                        <td>{client.probed_essids}</td>
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
              </tr>
            </thead>
            <tbody>
              {scan.unlinked_clients.map(client => (
                <tr key={client.mac}>
                  <td>{client.mac}</td>
                  <td>{client.power}</td>
                  <td>{client.first_seen}</td>
                  <td>{client.last_seen}</td>
                  <td>{client.probed_essids}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </Body>
  );
}
