import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Collapse from 'react-bootstrap/Collapse';
import { FiDownload, FiEdit, FiSave, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import TimeAgo from './TimeAgo';
import { formatFileSize } from '../utils/format';

export default function ScanHeader({ scan, onDownload, onUpdate }) {
  const createdDate = scan.created_at ? new Date(scan.created_at) : null;
  const apCount = scan.access_points?.length || 0;

  const [editMode, setEditMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    description: scan.description || '',
    location: scan.location || ''
  });

  const handleSave = () => {
    onUpdate?.(formData);
    setEditMode(false);
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            Scan am{' '}
            {createdDate
              ? createdDate.toLocaleString('de-DE', {
                //timeZone: 'UTC',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
              : '–'}{' '}
            (<TimeAgo isoDate={createdDate} />)
          </h5>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setEditMode(true)}
            disabled={editMode}
          >
            <FiEdit className="me-1" />
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={onDownload}>
            <FiDownload className="me-1" />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Einblenden' : 'Ausblenden'}
          >
            {collapsed ? <FiChevronDown /> : <FiChevronUp />}
          </Button>
        </div>
      </Card.Header>

      <Collapse in={!collapsed}>
        <Card.Body>
          <Row>
            <Col md={6}>
              <dl className="row mb-0">
                <dt className="col-sm-4">Beschreibung:</dt>
                <dd className="col-sm-8">
                  {editMode ? (
                    <Form.Control
                      type="text"
                      size="sm"
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    />
                  ) : (
                    scan.description || <em>keine Beschreibung</em>
                  )}
                </dd>

                <dt className="col-sm-4">Ort:</dt>
                <dd className="col-sm-8">
                  {editMode ? (
                    <Form.Control
                      type="text"
                      size="sm"
                      value={formData.location}
                      onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                    />
                  ) : (
                    scan.location || <em>kein Ort</em>
                  )}
                </dd>
              </dl>
            </Col>
            <Col md={6}>
              <dl className="row mb-0">
                <dt className="col-sm-4">Dauer:</dt>
                <dd className="col-sm-8">{scan.duration ? `${scan.duration}s` : '–'}</dd>

                <dt className="col-sm-4">Dateigröße:</dt>
                <dd className="col-sm-8">{formatFileSize(scan.filesize)}</dd>

                <dt className="col-sm-4">Access Points:</dt>
                <dd className="col-sm-8">{apCount}</dd>
              </dl>
            </Col>
          </Row>

          {editMode && (
            <div className="mt-3 d-flex gap-2">
              <Button size="sm" variant="success" onClick={handleSave}>
                <FiSave className="me-1" /> Speichern
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setEditMode(false)}>
                <FiX />
              </Button>
            </div>
          )}
        </Card.Body>
      </Collapse>
    </Card>
  );
}
