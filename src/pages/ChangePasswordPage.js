import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Body from "../components/Body";
import InputField from "../components/InputField";
import { useApi } from "../contexts/ApiProvider";
import { useFlash } from "../contexts/FlashProvider";

export default function ChangePasswordPage() {
    const [formErrors, setFormErrors] = useState({});
    const oldPasswordField = useRef();
    const passwordField = useRef();
    const password2Field = useRef();
    const api = useApi();
    const navigate = useNavigate();
    const flash = useFlash();

    useEffect(() => {
        oldPasswordField.current.focus();
    }, []);

    const onSubmit = async (ev) => {
        ev.preventDefault();
        if (passwordField.current.value !== password2Field.current.value) {
            setFormErrors({ password2: 'Passwords do not match.' });
        }
        else {
            const response = await api.put('/me', {
                old_password: oldPasswordField.current.value,
                password: passwordField.current.value,
            });
            if (response.ok) {
                setFormErrors({});
                flash('Your password has been changed.', 'success');
                navigate('/');
            }
            else {
                setFormErrors(response.body.errors.json);
            }
        }
    };

    return (
        <Body sidebar>
            <h1>Change your Password</h1>
            <Form onSubmit={onSubmit}>
                <InputField
                    name="oldPassword" label="Old Password" type="password"
                    error={formErrors.old_password} fieldRef={oldPasswordField}
                />
                <InputField
                    name="password" label="Password" type="password"
                    error={formErrors.password} fieldRef={passwordField}
                />
                <InputField
                    name="password2" label="Password again" type="password"
                    error={formErrors.password2} fieldRef={password2Field}
                />
                <Button variant="primary" type="submit">Register</Button>
            </Form>
        </Body>
    );
}