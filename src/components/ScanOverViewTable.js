import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Body from '../components/Body';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const filteredScans = initialScans.filter(scan =>
    Object.values(scan).some(val =>
      val?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Body sidebar>
      <h2>Alle Scans</h2>

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
                <Button variant="primary" size="sm" onClick={() => navigate(`/scan/${scan.id}`)}>
                  Details
                </Button>{' '}
                <Button variant="danger" size="sm">
                  Löschen
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Body>
  );
}