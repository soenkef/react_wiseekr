// Clients.js
import React from 'react';
import Client from './Client';

export default function Clients({ clients }) {
    return (
        <div>
            <h6>Clients:</h6>
            {clients.length === 0 ? <p>Keine verbundenen Clients.</p> : (
                <div>
                    {clients.map(client => (
                        <Client key={client.mac} client={client} />
                    ))}
                </div>
            )}
        </div>
    );
}
