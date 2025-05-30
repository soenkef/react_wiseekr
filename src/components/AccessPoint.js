import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import Collapse from 'react-bootstrap/Collapse';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from 'react-bootstrap/Spinner';
import {
  FiAlertTriangle,
  FiWifiOff,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiStopCircle,
  FiBarChart2
} from 'react-icons/fi';
import Clients from './Clients';
import AccessPointFlowModal from './AccessPointFlowModal';


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
  infiniteDeauths,
  stopDeauth,
  renderCrackButton,
  isCracking,
  scanMeta,
  loopingAp,
  startLoopScanAp,
  stopLoopScanAp,
  deauthTargetKey,
}) {
  const hasCam = ap.clients.some(c => c.is_camera);
  const clientCount = new Set(ap.clients.map(c => c.mac)).size;

  const handshakeCount = ap.clients.reduce((count, c) => {
    const key = `${ap.bssid}|${c.mac}`;
    return handshakeFiles[key] ? count + 1 : count;
  }, handshakeFiles[`${ap.bssid}|AP`] ? 1 : 0);

  const apKey = `${ap.bssid}|AP`;
  const isInfinite = infiniteDeauths.has(apKey);
  const [showModal, setShowModal] = useState(false);

  const [showGraphModal, setShowGraphModal] = useState(false);



  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header style={{ cursor: 'pointer' }} onClick={() => toggleOpen(ap.bssid)}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {hasCam && (
              <FiAlertTriangle
                className="text-warning me-2"
                role="button"
                title="Kameragerät"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
              />
            )}

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
            <strong>{ap.essid || '<Hidden>'}</strong>{' '}
            {ap.cracked_password && (
              <div className="mt-2 text-success">
                <strong>🔓 Passwort:</strong> {ap.cracked_password}
              </div>
            )}
            <span className="text-muted">({clientCount} Clients)</span>
          </div>
          <ButtonGroup size="sm" className="gap-1">
            {renderDeauthStatus(ap.bssid, null)}

            {isInfinite && deauthBssid === ap.bssid && (
              <Button variant="warning" size="sm" onClick={e => { e.stopPropagation(); stopDeauth(ap.bssid); }}>
                Stop
              </Button>
            )}

            <Button
              variant={isInfinite ? 'warning' : 'danger'}
              size="sm"
              disabled={activeDeauths[apKey]}
              onClick={e => {
                e.stopPropagation();
                if (isInfinite) {
                  stopDeauth(ap.bssid);
                } else {
                  onDeauthAp(ap.bssid);
                }
              }}
            >
              {isInfinite ? <FiStopCircle /> : <FiWifiOff />}
            </Button>

            <div onClick={e => e.stopPropagation()} className="btn-group-item">{renderHandshakeDropdown(ap)}</div>

            {renderCrackButton && (
              <div className="btn-group-item">{renderCrackButton(ap)}</div>
            )}

            <Button
              variant="outline-secondary"
              size="sm"
              disabled={rescanBssid === ap.bssid && rescanProgress < 100}
              onClick={e => {
                e.stopPropagation();
                onRescan(ap.bssid);
              }}
            >
              <FiRefreshCw />
            </Button>

            {loopingAp === ap.bssid && (
              <Button
                variant="warning"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  stopLoopScanAp();
                }}
              >
                Stop ∞
              </Button>
            )}

            <Button
              variant="outline-secondary"
              size="sm"
              title="Client-Graph anzeigen"
              onClick={e => {
                e.stopPropagation();
                setShowGraphModal(true);
              }}
            >
              <FiBarChart2 />
            </Button>

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

        {deauthTargetKey &&
          infiniteDeauths.has(deauthTargetKey) &&
          deauthTargetKey.startsWith(`${ap.bssid}|`) && (
            <div className="d-flex justify-content-end align-items-center gap-2 text-muted small mt-2">
              <span>Unendlicher Deauth läuft…</span>
              <Spinner animation="border" size="sm" variant="danger" />
            </div>
          )}


        {deauthTargetKey &&
          deauthTargetKey.startsWith(`${ap.bssid}|`) &&
          !infiniteDeauths.has(deauthTargetKey) &&
          deauthProgress > 0 &&
          deauthProgress < 100 && (
            <>
              <ProgressBar
                now={deauthProgress}
                animated
                striped
                variant="danger"
                className="mt-2"
                style={{ height: '4px', borderRadius: '2px' }}
                label={`${Math.round(deauthProgress)}%`}
              />
              <div className="text-end small text-muted">Deauth läuft…</div>
            </>
          )}


        {loopingAp === ap.bssid && (
          <div className="text-end small text-muted">Unendlicher AP-Scan läuft…</div>
        )}
        {isCracking && (
          <div className="text-end small text-muted">Cracking läuft…</div>
        )}


        {rescanStartTime !== null &&
          ap.bssid === rescanBssid &&
          rescanProgress < 100 && (
            <>
              <ProgressBar
                now={rescanProgress}
                animated
                striped
                className="mt-2"
                style={{ height: '4px', borderRadius: '2px' }}
                variant="info"
              />
              <div className="text-end small text-muted">Rescan läuft…</div>
            </>
          )}
      </Card.Header>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Achtung</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Dieses Gerät oder ein verbundenes Gerät wurde als mögliche <strong>Überwachungstechnik</strong> erkannt
            (z. B. Kamera oder ähnliches).
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Schließen
          </Button>
        </Modal.Footer>
      </Modal>

      <Collapse in={openMap[ap.bssid]}>
        <Card.Body className="bg-light">
          <div className="row g-2 mb-3">
            {[
              ['BSSID', ap.bssid],
              ['Channel', ap.channel],
              ['Vendor', ap.vendor || '–'],
              ['Privacy', ap.privacy],
              ['Cracked Password', ap.cracked_password || '–'],
              ['First Seen', new Date(ap.first_seen).toLocaleString(undefined, { timeZone: 'UTC' })],
              ['Last Seen', new Date(ap.last_seen).toLocaleString(undefined, { timeZone: 'UTC' })],
              ['Power', ap.power !== undefined ? `${ap.power} dBm` : '–'],
              ['Packets', ap.packets !== undefined ? ap.packets : '–']
            ].map(([label, val]) => (
              <div key={label} className="col-12 col-md-6">
                <strong>{label}:</strong> {val}
              </div>
            ))}
          </div>
          <hr />

          <Clients
            apBssid={ap.bssid}
            clients={ap.clients}
            handleDeauthClient={onDeauthClient}
            renderDeauthStatus={renderDeauthStatus}
            renderHandshakeLink={renderHandshakeLink}
            activeDeauths={activeDeauths}
            deauthInProgress={deauthProgress > 0 && deauthProgress < 100}
            isInfinite={isInfinite}
            infiniteDeauths={infiniteDeauths}
            stopDeauth={stopDeauth}
            handshakeFiles={handshakeFiles}
          />
        </Card.Body>
      </Collapse>
      <AccessPointFlowModal show={showGraphModal} onHide={() => setShowGraphModal(false)} ap={{ ...ap, ...scanMeta }} />

    </Card>
  );
}
