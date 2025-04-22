// src/components/ScanTable.js
import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

export default function ScanTable({ data, type }) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key]?.toString().toLowerCase();
    const valB = b[sortConfig.key]?.toString().toLowerCase();
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter((row) =>
    Object.values(row).some(val =>
      val?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  const columns = type === 'ap' ? [
    { key: 'bssid', label: 'BSSID' },
    { key: 'essid', label: 'ESSID' },
    { key: 'channel', label: 'Channel' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'power', label: 'Power' }
  ] : [
    { key: 'mac', label: 'Client MAC' },
    { key: 'bssid', label: 'Connected AP' },
    { key: 'power', label: 'Power' }
  ];

  return (
    <div>
      <Form.Control
        type="text"
        placeholder="Suche..."
        className="mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} onClick={() => handleSort(col.key)} style={{ cursor: 'pointer' }}>
                {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
            ))}
            <th>Optionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr key={index}>
              {columns.map(col => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
              <td><Button variant="danger" size="sm">DEAUTH</Button></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
