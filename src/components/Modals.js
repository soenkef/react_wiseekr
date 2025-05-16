// Modals.js
import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export function DeauthModal({ show, onHide, onSubmit }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Deauth starten</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Anzahl Pakete</Form.Label>
                        <Form.Control type="number" placeholder="10" />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Abbrechen</Button>
                <Button variant="danger" onClick={onSubmit}>Starten</Button>
            </Modal.Footer>
        </Modal>
    );
}

export function RescanModal({ show, onHide, onSubmit }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Rescan starten</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Dauer (Sekunden)</Form.Label>
                        <Form.Control type="number" placeholder="60" />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Abbrechen</Button>
                <Button variant="success" onClick={onSubmit}>Starten</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default { DeauthModal, RescanModal };
