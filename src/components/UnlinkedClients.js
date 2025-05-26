import React, { useState, useMemo } from 'react';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import { FiArrowUp, FiArrowDown, FiAlertTriangle } from 'react-icons/fi';

export default function UnlinkedClients({ scan }) {
  const [sort, setSort] = useState({ column: 'mac', asc: true });
  const list = useMemo(() => scan.unlinked_clients || [], [scan.unlinked_clients]);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => {
      let av = a[sort.column] ?? '';
      let bv = b[sort.column] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sort.asc ? -1 : 1;
      if (av > bv) return sort.asc ? 1 : -1;
      return 0;
    });
  }, [list, sort]);

  const sortOptions = ['mac', 'vendor', 'power'];

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Clients ohne Access Point</h5>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            Sortieren nach: {sort.column} {sort.asc ? <FiArrowUp /> : <FiArrowDown />}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {sortOptions.map(opt => (
              <Dropdown.Item
                key={opt}
                onClick={() =>
                  setSort(prev => ({
                    column: opt,
                    asc: prev.column === opt ? !prev.asc : true
                  }))
                }
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}{' '}
                {sort.column === opt && (sort.asc ? <FiArrowUp /> : <FiArrowDown />)}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted">Keine ungebundenen Clients.</p>
      ) : (
        sorted.map(c => (
          <Card className="mb-3 shadow-sm" key={c.mac}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-monospace mb-1">
                    {c.is_camera && (
                      <span className="text-warning me-2" title="Kameragerät">
                        <FiAlertTriangle size={18} />
                      </span>
                    )}
                    {c.mac}
                  </h6>
                  <div className="text-muted small">
                    Vendor: {c.vendor || '–'} | Power: {c.power ?? '–'} dBm
                  </div>
                  {c.probed_essids && (
                    <div className="mt-2 text-muted small">
                      <strong>Probed ESSIDs:</strong> {c.probed_essids}
                    </div>
                  )}
                </div>
                <div className="text-end">
                  <div className="small text-muted">
                    <div>First: {new Date(c.first_seen).toLocaleString(undefined, { timeZone: 'UTC' })}</div>
                    <div>Last: {new Date(c.last_seen).toLocaleString(undefined, { timeZone: 'UTC' })}</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
}
