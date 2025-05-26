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
  FiDownload,
  FiStopCircle
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
  renderHandshakeDropdown,
  activeDeauths,
  deauthProgress,
  rescanStartTime,
  rescanBssid,
  rescanProgress,
  deauthBssid,
  infinite,
  stopDeauth
}) {
  const hasCam = ap.clients.some(c => c.is_camera);
  const clientCount = ap.clients.length;

  const handshakeCount = ap.clients.reduce((count, c) => {
    const key = `${ap.bssid}|${c.mac}`;
    return handshakeFiles[key] ? count + 1 : count;
  }, handshakeFiles[`${ap.bssid}|AP`] ? 1 : 0);

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header style={{ cursor: 'pointer' }} onClick={() => toggleOpen(ap.bssid)}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {hasCam && <FiAlertTriangle className="text-warning me-2" />}
            {handshakeCount > 0 && (
              <span
                className="badge bg-success me-2"
                title={`${handshakeCount} Handshake-Datei(en) vorhanden`}
                style={{ fontSize: '0.75em' }}
              >
                <FiDownload className="me-1" />
                {handshakeCount}
              </span>
            )}
            <strong>{ap.essid || '<Hidden>'}</strong>
            {' '}
            <span className="text-muted">({clientCount} Clients)</span>
          </div>
          <ButtonGroup size="sm">
            {/* Spinner bei laufendem Deauth */}
            {renderDeauthStatus(ap.bssid, null)}

            {/* STOP BUTTON – nur bei infinite Deauth auf diesem AP */}
            {infinite && deauthBssid === ap.bssid && (
              <Button
                variant="warning"
                size="sm"
                className="me-1"
                onClick={e => { e.stopPropagation(); stopDeauth(ap.bssid); }}
              >
                Stop
              </Button>
            )}

            <Button
              variant={infinite ? 'warning' : 'danger'}
              size="sm"
              disabled={ap.bssid === deauthBssid && deauthProgress > 0 && deauthProgress < 100}
              onClick={e => {
                e.stopPropagation();
                if (infinite) {
                  stopDeauth(ap.bssid);
                } else {
                  onDeauthAp(ap.bssid);
                }
              }}
              className="me-1"
            >
              {infinite ? <FiStopCircle /> : <FiWifiOff />}
            </Button>

            {/* Alle Handshake-Buttons (AP + Clients) */}
            {renderHandshakeDropdown(ap)}

            {/* Rescan-Button */}
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={rescanBssid === ap.bssid && rescanProgress < 100}
              onClick={e => {
                e.stopPropagation();
                onRescan(ap.bssid);
              }}
              className="me-1"
            >
              <FiRefreshCw />
            </Button>

            {/* Toggle-Collapse */}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                toggleOpen(ap.bssid);
              }}
            >
              {openMap[ap.bssid] ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          </ButtonGroup>
        </div>

        {/* Deauth-Progressbar */}
        {ap.bssid === deauthBssid && deauthProgress > 0 && deauthProgress < 100 && (
          <ProgressBar
            now={deauthProgress}
            animated
            striped
            variant={infinite ? 'warning' : 'danger'}
            className="mt-2"
            style={{ height: '4px', borderRadius: '2px' }}
          />
        )}

        {/* Rescan-Progressbar */}
        {rescanStartTime !== null && rescanBssid === ap.bssid && rescanProgress < 100 && (
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
          {/* AP-Details */}
          <div className="row g-2 mb-3">
            {[
              ['BSSID', ap.bssid],
              ['Channel', ap.channel],
              ['Vendor', ap.vendor || '–'],
              ['Privacy', ap.privacy],
              ['First Seen', new Date(ap.first_seen).toLocaleString(undefined, { timeZone: 'UTC' })],
              ['Last Seen', new Date(ap.last_seen).toLocaleString(undefined, { timeZone: 'UTC' })], ['Power', ap.power !== undefined ? `${ap.power} dBm` : '–'],
              ['Packets', ap.packets !== undefined ? ap.packets : '–']
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
            infinite={infinite}
            stopDeauth={stopDeauth}
          />
        </Card.Body>
      </Collapse>
    </Card>
  );
}
