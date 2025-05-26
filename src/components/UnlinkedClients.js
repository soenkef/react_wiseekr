import React, { useState, useMemo } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { FiArrowUp, FiArrowDown, FiAlertTriangle } from 'react-icons/fi';
import TimeAgo from './TimeAgo';

export default function UnlinkedClients({ scan }) {
  const [sort, setSort] = useState({ column: null, asc: true });
  const list = useMemo(() => scan.unlinked_clients || [], [scan.unlinked_clients]);

  const sorted = useMemo(() => {
    if (!sort.column) return list;
    return [...list].sort((a, b) => {
      let av = a[sort.column] || '';
      let bv = b[sort.column] || '';
      if (av < bv) return sort.asc ? -1 : 1;
      if (av > bv) return sort.asc ? 1 : -1;
      return 0;
    });
  }, [list, sort]);

  const toggleSort = col => setSort(p => ({ column: col, asc: p.column === col ? !p.asc : true }));

  return (
    <Card className="mt-4">
      <Card.Header><h5 className="mb-0">Clients ohne Access Point</h5></Card.Header>
      <Card.Body className="p-0">
        {list.length === 0 ? (
          <p className="m-3 text-muted">Keine ungebundenen Clients.</p>
        ) : (
          <Table hover striped responsive className="mb-0">
            <thead>
              <tr>
                <th onClick={() => toggleSort('mac')} style={{ cursor: 'pointer' }}>
                  MAC {sort.column === 'mac' && (sort.asc ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th onClick={() => toggleSort('vendor')} style={{ cursor: 'pointer' }}>
                  Vendor {sort.column === 'vendor' && (sort.asc ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th>Cam</th>
                <th onClick={() => toggleSort('power')} style={{ cursor: 'pointer' }}>
                  Power {sort.column === 'power' && (sort.asc ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th>First Seen</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => (
                <tr key={c.mac}>
                  <td className="text-monospace">{c.mac}</td>
                  <td>{c.vendor || '–'}</td>
                  <td>{c.is_camera ? <FiAlertTriangle className="text-warning" /> : 'No'}</td>
                  <td>{c.power}</td>
                  <td><TimeAgo isoDate={c.first_seen} /></td>
                  <td><TimeAgo isoDate={c.last_seen} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
