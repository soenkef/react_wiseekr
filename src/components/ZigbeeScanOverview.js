import React from 'react';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

export default function ZigbeeScanOverview({ scans = [], devices = [], scanDevices = [] }) {
  return (
    <div className="mb-4">
      <h3>Zigbee-Scan Übersicht</h3>
      {scans.length === 0 && (
        <div className="text-muted fst-italic mb-3">Keine Zigbee-Geräte gefunden.</div>
      )}
      {scans.map(scan => (
        <Card className="mb-3" key={scan.id}>
          <Card.Header>
            <strong>Scan #{scan.id}</strong> — {scan.description || 'Kein Titel'} <br />
            <small>{new Date(scan.timestamp).toLocaleString()} @ {scan.location || 'unbekannt'}</small>
          </Card.Header>
          <Card.Body>
            <p>
              Dauer: {scan.duration}s <br />
              Dauer pro Kanal: {scan.duration_per_channel ?? '—'}s <br />
              Kanal(e): {Array.isArray(scan.channels) ? scan.channels.join(', ') : scan.channel || 'unbekannt'} <br />
              PAN ID: {scan.pan_id || '—'} <br />
              Quelle: {scan.source || 'cc2531'} <br />
              Geräteanzahl: {scan.device_count || 0}
            </p>

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>IEEE-Adresse</th>
                  <th>Typ</th>
                  <th>Hersteller</th>
                  <th>Modell</th>
                  <th>RSSI</th>
                  <th>LQI</th>
                  <th>Endpoints</th>
                  <th>Cluster</th>
                </tr>
              </thead>
              <tbody>
                {scanDevices
                  .filter(sd => sd.scan_id === scan.id)
                  .map((sd, idx) => {
                    const dev = devices.find(d => d.id === sd.device_id);
                    return (
                      <tr key={sd.id || `${scan.id}-${idx}`}>
                        <td>{dev?.id || '?'}</td>
                        <td>{dev?.ieee_addr || '—'}</td>
                        <td>{dev?.device_type || '—'}</td>
                        <td>{dev?.manufacturer || '—'}</td>
                        <td>{dev?.model_id || '—'}</td>
                        <td>{sd.rssi ?? '—'} dBm</td>
                        <td>{sd.lqi ?? '—'}</td>
                        <td>{Array.isArray(dev?.endpoints) ? dev.endpoints.join(', ') : dev?.endpoint || '—'}</td>
                        <td>{Array.isArray(dev?.clusters) ? dev.clusters.join(', ') : '—'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
            <Button variant="outline-secondary" size="sm" onClick={() => console.log('Scan-Debug:', scan, scanDevices)}>
              Debug anzeigen
            </Button>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
