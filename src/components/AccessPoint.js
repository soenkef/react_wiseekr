import React from 'react';
import Card from 'react-bootstrap/Card';
import Collapse from 'react-bootstrap/Collapse';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {
  FiAlertTriangle,
  FiWifiOff,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiDownload
} from 'react-icons/fi';
import Clients from './Clients';

export default function AccessPoint({
  ap,
  handshakeFiles,
  openMap,
  toggleOpen,
  onDeauthAp,
  onDeauthClient,
  onRescan,
  renderDeauthStatus,
  renderHandshakeLink,
  activeDeauths,
  deauthProgress,
  rescanStartTime,
  rescanBssid,
  rescanProgress,
  deauthBssid,

}) {
  const hasCam = ap.clients.some(c => c.is_camera);
  const hsKey = `${ap.bssid}|AP`;
  const hasHandshake = Object.keys(handshakeFiles)
    .some(key => key.startsWith(`${ap.bssid}|`));
  const clientCount = ap.clients.length;


  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header style={{ cursor: 'pointer' }} onClick={() => toggleOpen(ap.bssid)}>
        <div className="d-flex justify-content-between align-items-center">
          {console.log("Handshake file:", ap.handshake_file)}
          <div>
            {hasCam && <FiAlertTriangle className="text-warning me-2" />}
            {hasHandshake && (
              <FiDownload
                className="text-success me-2"
                title="Handshake vorhanden"
              />
            )}
            <strong>{ap.essid || '<Hidden>'}</strong>
            {' '}
            <span className="text-muted">({clientCount} Clients)</span>
          </div>
          <ButtonGroup size="sm">
            {/* Deauth-Spinner */}
            {renderDeauthStatus(ap.bssid, null)}
            {/* Deauth-Button */}
            <Button
              variant="danger"
              disabled={deauthProgress > 0 && deauthProgress < 100}
              onClick={e => { e.stopPropagation(); onDeauthAp(ap.bssid); }}
            ><FiWifiOff /></Button>
            {/* Handshake */}
            {renderHandshakeLink(ap.bssid, null)}
            {/* Rescan */}
            <Button
              variant="outline-secondary"
              disabled={rescanBssid === ap.bssid && rescanProgress < 100}
              onClick={e => { e.stopPropagation(); onRescan(ap.bssid); }}
            ><FiRefreshCw /></Button>
            {/* Collapse toggle */}
            <Button
              variant="outline-primary"
              onClick={e => { e.stopPropagation(); toggleOpen(ap.bssid); }}
            >
              {openMap[ap.bssid] ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          </ButtonGroup>
        </div>

        {/* Deauth Progressbar */}
        {ap.bssid === deauthBssid && deauthProgress > 0 && deauthProgress < 100 && (
          <ProgressBar
            now={deauthProgress}
            animated
            striped
            variant="danger"
            className="mt-2"
            style={{ height: '4px', borderRadius: '2px' }}
          />
        )}

        {/* Rescan Progressbar */}
        {rescanStartTime !== null
          && rescanBssid === ap.bssid
          && rescanProgress < 100 && (
            <ProgressBar
              now={rescanProgress}
              animated
              striped
              className="mt-2"
              style={{ height: '4px', borderRadius: '2px' }}
            />
          )}
      </Card.Header>

      <Collapse in={openMap[ap.bssid]}>
        <Card.Body className="bg-light">
          {/* AP Details */}
          <div className="row g-2 mb-3">
            {[
              ['BSSID', ap.bssid],
              ['Channel', ap.channel],
              ['Vendor', ap.vendor || '–'],
              ['Privacy', ap.privacy],
              ['First Seen', new Date(ap.first_seen).toLocaleString(undefined, { timeZone: 'UTC' })],
              ['Last Seen', new Date(ap.last_seen).toLocaleString(undefined, { timeZone: 'UTC' })]
            ].map(([label, val]) => (
              <div key={label} className="col-12 col-md-6">
                <strong>{label}:</strong> {val}
              </div>
            ))}
          </div>

          <Clients
            apBssid={ap.bssid}
            clients={ap.clients}
            handleDeauthClient={onDeauthClient}
            renderDeauthStatus={renderDeauthStatus}
            renderHandshakeLink={renderHandshakeLink}
            activeDeauths={activeDeauths}
            deauthInProgress={deauthProgress > 0 && deauthProgress < 100}
          />
        </Card.Body>
      </Collapse>
    </Card>
  );
}
