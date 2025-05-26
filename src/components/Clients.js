import React from 'react';
import Client from './Client'; // das ist die Card-Komponente

export default function Clients({
  apBssid,
  clients,
  handleDeauthClient,
  renderDeauthStatus,
  renderHandshakeLink,
  activeDeauths,
  deauthInProgress,
  infiniteDeauths,
  stopDeauth,
}) {
  return (
    <>
      <h6>Clients</h6>
      {clients.length === 0 ? (
        <p><em>Keine verbundenen Clients gefunden.</em></p>
      ) : (
        clients.map(client => {
          const key = `${apBssid}|${client.mac}`;
          const isInfinite = infiniteDeauths.has(key);
          const isActive = !!activeDeauths[key];
          const showStop = isInfinite;

          return (
            <Client
              key={client.mac}
              client={client}
              apBssid={apBssid}
              handleDeauthClient={handleDeauthClient}
              renderDeauthStatus={renderDeauthStatus}
              renderHandshakeLink={renderHandshakeLink}
              activeDeauths={activeDeauths}
              deauthInProgress={deauthInProgress}
              infinite={isInfinite}
              showStop={showStop}
              stopDeauth={() => stopDeauth(apBssid, client.mac)}
            />
          );
        })
      )}
    </>
  );
}