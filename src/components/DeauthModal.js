import React from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';

export default function DeauthModal({
  show,
  onHide,
  options,            // { packets, duration, infinite }
  onChangeOptions,    // (newOptions) => void
  onSubmit,
  isRunning           // boolean: ob gerade deauth läuft
}) {
  const { packets, duration, infinite } = options;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Deauth starten</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Pakete */}
          <Form.Group className="mb-3">
            <Form.Label>Pakete ({infinite ? '∞ unendlich' : packets})</Form.Label>
            <RangeSlider
              min={1}
              max={100}
              step={1}
              value={packets}
              disabled={infinite}
              tooltip="off"
              onChange={e => onChangeOptions({ ...options, packets: +e.target.value })}
            />
            <Form.Check
              className="mt-2"
              type="checkbox"
              label="Unendlich"
              checked={infinite}
              onChange={e => onChangeOptions({ ...options, infinite: e.target.checked })}
            />
          </Form.Group>

          {/* Dauer */}
          <Form.Group className="mb-3">
            <Form.Label>Dauer ({duration} Sekunden)</Form.Label>
            <RangeSlider
              min={10}
              max={600}
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
        <Button variant="danger" onClick={onSubmit} disabled={isRunning}>
          {isRunning ? <Spinner animation="border" size="sm" /> : 'Deauth starten'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
