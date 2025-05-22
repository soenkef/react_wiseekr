import React from 'react';
import Client from './Client';

export default function Clients({
  apBssid,
  clients,
  handleDeauthClient,
  renderDeauthStatus,
  renderHandshakeLink,
  activeDeauths,
  deauthInProgress
}) {
  return (
    <div>
      <h6 className="mb-3">Clients ({clients.length})</h6>
      {clients.length === 0 ? (
        <p>Keine verbundenen Clients.</p>
      ) : (
        clients.map(client => (
          <Client
            key={client.mac}
            client={client}
            apBssid={apBssid}
            handleDeauthClient={handleDeauthClient}
            renderDeauthStatus={renderDeauthStatus}
            renderHandshakeLink={renderHandshakeLink}
            activeDeauths={activeDeauths}
            deauthInProgress={deauthInProgress}
          />
        ))
      )}
    </div>
  );
}
