import React from 'react';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

// Beispiel-Testdaten
import { testScans, testDevices, testScanDevices } from '../components/testData';

/**
 * Zeigt eine Übersicht aller Zigbee-Scans mit zugehörigen Geräten
 * Props (optional):
 *  - scans, devices, scanDevices  (Fallback auf Testdaten)
 */
export default function ZigbeeScanOverview({ scans = testScans, devices = testDevices, scanDevices = testScanDevices }) {
  return (
    <div className="mb-4">
      <h3>Zigbee-Testdaten Übersicht</h3>
      {scans.map(scan => (
        <Card className="mb-3" key={scan.id}>
          <Card.Header>
            Scan #{scan.id} — {scan.description} ({new Date(scan.timestamp).toLocaleString()})
          </Card.Header>
          <Card.Body>
            <p>Dauer: {scan.duration}s, Kanal: {scan.channel}, PAN ID: {scan.pan_id}</p>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Device ID</th><th>IEEE Addr</th><th>Typ</th><th>Herst.</th><th>RSSI</th><th>LQI</th><th>Endpoint</th>
                </tr>
              </thead>
              <tbody>
                {scanDevices
                  .filter(sd => sd.scan_id === scan.id)
                  .map(sd => {
                    const dev = devices.find(d => d.id === sd.device_id);
                    return (
                      <tr key={sd.id}>
                        <td>{dev.id}</td>
                        <td>{dev.ieee_addr}</td>
                        <td>{dev.device_type}</td>
                        <td>{dev.manufacturer}</td>
                        <td>{sd.rssi} dBm</td>
                        <td>{sd.lqi}</td>
                        <td>{sd.endpoint}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
            <Button variant="primary" size="sm" onClick={() => console.log(`Daten für Scan ${scan.id}:`, scan, devices, scanDevices)}>
              Debug-Log
            </Button>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
