import Form from 'react-bootstrap/Form';

export default function ImportField( 
    { name, label, type, placeholder, error, fieldRef } ) {
    return (
        <Form.Group controlId={name} className="InputField">
            {label && <Form.Label>{label}</Form.Label>}
            <Form.Control 
                type={type || 'text'} 
                placeholder={placeholder}
                ref={fieldRef}>
            </Form.Control>
            <Form.Text className="text-danger">{error}</Form.Text>
        </Form.Group>
    );
}