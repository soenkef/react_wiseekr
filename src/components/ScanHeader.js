import React from 'react'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { FiDownload } from 'react-icons/fi'
import TimeAgo from '../components/TimeAgo'
import { formatFileSize } from '../utils/format'

export default function ScanHeader({ scan, onDownload }) {
  const date = scan.created_at
    ? new Date(scan.created_at).toLocaleString('de-DE')
    : '–'

  // Anzahl der gefundenen Access Points
  const apCount = scan.access_points ? scan.access_points.length : 0;

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        {/* Linke Seite: Scan-Titel + Zeit */}
        <div>
          <h5 className="mb-0">
            Scan: <br />
          </h5>
          {date ? new Date(date).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '–'} (<TimeAgo isoDate={date} />)
        </div>

        {/* Rechte Seite: Download-Button */}
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onDownload}
        >
          <FiDownload className="me-1" />
          CSV herunterladen
        </Button>
      </Card.Header>

      <Card.Body>
        <Row>
          <Col md={6}>
            <dl className="row mb-0">
              <dt className="col-sm-4">Beschreibung:</dt>
              <dd className="col-sm-8">{scan.description || '–'}</dd>

              <dt className="col-sm-4">Ort:</dt>
              <dd className="col-sm-8">{scan.location || '–'}</dd>
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
      </Card.Body>
    </Card>
  )
}
