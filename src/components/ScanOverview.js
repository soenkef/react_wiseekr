// src/components/ScanOverview.js
import React from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import TimeAgo from './TimeAgo';
import { FiDownload, FiTrash, FiEdit } from 'react-icons/fi';

/**
 * Props:
 * - scans: array of scan objects
 * - search: string, search filter
 * - onSearchChange: fn(e) => void
 * - requestSort(field): fn
 * - headerArrow(field): string
 * - onNavigate(id): fn
 * - onDelete(id): fn
 * - onEdit(scan): fn
 * - onDownload(scan): fn
 */
export default function ScanOverview({
  scans,
  search,
  onSearchChange,
  requestSort,
  headerArrow,
  onNavigate,
  onDelete,
  onEdit,
  onDownload,
}) {
  return (
    <>
      <input
        type="search"
        placeholder="Suche nach Scan, Ort, Zeit..."
        className="mb-3 form-control"
        value={search}
        onChange={onSearchChange}
      />

      <Table striped hover responsive className="align-middle">
        <thead>
          <tr>
            <th onClick={() => requestSort('created_at')} style={{ cursor: 'pointer' }}>
              Erstellt am{headerArrow('created_at')}
            </th>
            <th onClick={() => requestSort('description')} style={{ cursor: 'pointer' }}>
              Beschreibung{headerArrow('description')}
            </th>
            <th onClick={() => requestSort('location')} style={{ cursor: 'pointer' }}>
              Ort{headerArrow('location')}
            </th>
            <th className="text-end">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {scans.map(s => (
            <tr
              key={s.id}
              onClick={e => !e.target.closest('button') && onNavigate(s.id)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                {s.created_at
                  ? new Date(s.created_at).toLocaleString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })
                  : '–'}
                <br />
                <small className="text-muted">
                  (<TimeAgo isoDate={s.created_at} />)
                </small>
              </td>
              <td>
                {s.description || <em>keine Beschreibung</em>}
                <br />
                <small className="text-muted">
                  ({s.access_points_count} APs)
                </small>
              </td>
              <td>{s.location || <em>kein Ort</em>}</td>
              <td className="text-end">
                <ButtonGroup className="d-flex gap-1 align-items-center flex-shrink-0 flex-wrap justify-content-end">
                  {s.filename ? (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={e => { e.stopPropagation(); onDownload(s); }}
                    >
                      <FiDownload />
                    </Button>
                  ) : (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled
                    >
                      –
                    </Button>
                  )}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={e => { e.stopPropagation(); onEdit(s); }}
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                  >
                    <FiTrash />
                  </Button>
                </ButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}