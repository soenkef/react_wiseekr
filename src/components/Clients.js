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
  // Entferne doppelte Clients anhand der MAC-Adresse
  const uniqueClients = Array.from(
    new Map(clients.map(client => [client.mac, client])).values()
  );

  return (
    <>
      <h6>Clients</h6>
      {uniqueClients.length === 0 ? (
        <p><em>Keine verbundenen Clients gefunden.</em></p>
      ) : (
        uniqueClients.map(client => {
          const key = `${apBssid}|${client.mac}`;
          const isInfinite = infiniteDeauths.has(key);
          const showStop = isInfinite;

          return (
            <Client
              key={key} // jetzt eindeutig
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
