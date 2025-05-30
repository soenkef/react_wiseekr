// src/components/Modals.js
import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';

export function DeauthModal({
  show,
  onHide,           // schließt das Modal
  options,          // { packets, duration, infinite }
  onChangeOptions,  // aktualisiert options im Parent
  onSubmit,         // führt den API-Call aus
}) {
  const { packets, duration, infinite } = options;

  const handleClick = () => {
    onHide();        // Modal schließen
    onSubmit();      // dann Deauth im Hintergrund starten
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Deauth starten</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>
              Pakete ({infinite ? '∞ unendlich' : packets})
            </Form.Label>
            <RangeSlider
              min={1}
              max={100}
              step={1}
              value={packets}
              disabled={infinite}
              tooltip="off"
              onChange={e =>
                onChangeOptions({ ...options, packets: +e.target.value })
              }
            />
            <Form.Check
              className="mt-2"
              type="checkbox"
              label="Unendlich"
              checked={infinite}
              onChange={e =>
                onChangeOptions({ ...options, infinite: e.target.checked })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Dauer ({duration} Sekunden)</Form.Label>
            <RangeSlider
              min={10}
              max={600}
              step={1}
              value={duration}
              tooltip="off"
              onChange={e =>
                onChangeOptions({ ...options, duration: +e.target.value })
              }
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Abbrechen
        </Button>
        <Button variant="danger" onClick={handleClick}>
          Deauth starten
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function RescanModal({
  show,
  onHide,
  options,
  onChangeOptions,
  onSubmit,
  isLooping,
  onStopLoop
}) {
  const { description, duration, infinite } = options;

  const handleSubmit = () => {
    onHide();
    onSubmit();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Rescan Access Point</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Beschreibung</Form.Label>
            <Form.Control
              type="text"
              value={description}
              onChange={e =>
                onChangeOptions({ ...options, description: e.target.value })
              }
            />
          </Form.Group>

          {!infinite && (
            <Form.Group className="mb-3">
              <Form.Label>Dauer ({duration} Sekunden)</Form.Label>
              <RangeSlider
                min={10}
                max={300}
                step={10}
                value={duration}
                tooltip="off"
                onChange={e =>
                  onChangeOptions({ ...options, duration: +e.target.value })
                }
              />
            </Form.Group>
          )}

          <Form.Check
            type="switch"
            id="rescan-infinite-switch"
            label="Unendlicher Scan (∞)"
            className="mb-3"
            checked={infinite}
            onChange={e =>
              onChangeOptions({ ...options, infinite: e.target.checked })
            }
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Abbrechen</Button>
        {infinite && isLooping ? (
          <Button variant="warning" onClick={() => { onHide(); onStopLoop(); }}>
            ∞ Scan stoppen
          </Button>
        ) : (
          <Button variant="success" onClick={handleSubmit}>
            {infinite ? '∞ Scan starten' : 'Rescan starten'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
