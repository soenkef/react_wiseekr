import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';

export default function RescanModal({
  show,
  onHide,
  options,         // { description, duration }
  onChangeOptions, // (newOptions) => void
  onSubmit,
  isRunning        // boolean: ob gerade rescan läuft
}) {
  const { description, duration } = options;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Rescan Access Point</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Beschreibung */}
          <Form.Group className="mb-3">
            <Form.Label>Beschreibung</Form.Label>
            <Form.Control
              type="text"
              value={description}
              onChange={e => onChangeOptions({ ...options, description: e.target.value })}
            />
          </Form.Group>

          {/* Dauer */}
          <Form.Group className="mb-3">
            <Form.Label>Dauer ({duration} Sekunden)</Form.Label>
            <RangeSlider
              min={1}
              max={300}
              step={1}
              value={duration}
              tooltip="off"
              onChange={e => onChangeOptions({ ...options, duration: +e.target.value })}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Abbrechen
        </Button>
        <Button variant="success" onClick={onSubmit} disabled={isRunning}>
          {isRunning ? '...' : 'Rescan starten'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
