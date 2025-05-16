// AccessPoint.js
import React, { useState } from 'react';
import Clients from './Clients';

export default function AccessPoint({ ap }) {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => setOpen(!open);

    return (
        <div>
            <div onClick={toggleOpen} style={{ cursor: 'pointer' }}>
                <h5>{ap.essid || '<Hidden>'} - {ap.bssid}</h5>
            </div>
            {open && <Clients clients={ap.clients} />}
        </div>
    );
}
