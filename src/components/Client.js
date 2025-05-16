// Client.js
import React from 'react';

export default function Client({ client }) {
    return (
        <div>
            <p>MAC: {client.mac}</p>
            <p>Vendor: {client.vendor}</p>
            <p>Power: {client.power}</p>
        </div>
    );
}
