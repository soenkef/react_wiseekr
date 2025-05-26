import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';

import { FiAlertTriangle, FiWifiOff, FiStopCircle } from 'react-icons/fi';

export default function Client({
  client,
  apBssid,
  handleDeauthClient,
  renderDeauthStatus,
  renderHandshakeLink,
  activeDeauths,
  deauthInProgress,
  infinite,
  showStop,
  stopDeauth
}) {
  const key = `${apBssid}|${client.mac}`;
  const isCamera = client.is_camera;
  const [showModal, setShowModal] = useState(false);

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            {isCamera && (
              <>
                <FiAlertTriangle
                  className="text-warning me-2"
                  role="button"
                  title="Kameragerät"
                  onClick={(e) => {
                    e.stopPropagation(); // verhindert Toggle des Card-Headers
                    setShowModal(true);
                  }}
                />
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Achtung</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      Dieses Gerät wurde als mögliche <strong>Überwachungstechnik</strong> erkannt
                      (z. B. Kamera oder ähnliches).
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                      Schließen
                    </Button>
                  </Modal.Footer>
                </Modal>
              </>
            )}

            <span className="text-monospace fw-bold">{client.mac}</span>
          </div>
          <div className="d-flex align-items-center">
            {renderDeauthStatus(apBssid, client.mac)}

            {showStop && (
              <Button
                variant="warning"
                size="sm"
                onClick={e => {
                  e.stopPropagation(); // ← Wichtig!
                  stopDeauth();
                }}
                className="me-2"
              >
                <FiStopCircle className="me-1" />
                Stop
              </Button>
            )}


            <Button
              variant={infinite ? 'warning' : 'outline-danger'}
              size="sm"
              disabled={deauthInProgress || !!activeDeauths[key]}
              onClick={() => handleDeauthClient(apBssid, client.mac)}
              className="me-2"
            >
              <FiWifiOff className="me-1" />
              Deauth
            </Button>

            {renderHandshakeLink(apBssid, client.mac)}
          </div>
          
        </div>

        <ListGroup variant="flush">
          <ListGroup.Item>
            <strong>Vendor:</strong> {client.vendor || '–'}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Power:</strong> {client.power ?? '–'} dBm
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>First Seen:</strong>{' '}
            {new Date(client.first_seen).toLocaleString(undefined, { timeZone: 'UTC' })}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Last Seen:</strong>{' '}
            {new Date(client.last_seen).toLocaleString(undefined, { timeZone: 'UTC' })}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Probed ESSIDs:</strong> {client.probed_essids || '–'}
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
