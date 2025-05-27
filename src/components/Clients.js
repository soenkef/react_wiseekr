import React, { useState, useMemo } from 'react';
import Client from './Client';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FiFilter } from 'react-icons/fi';

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
  const [sort, setSort] = useState({ field: 'power', asc: false });

  const uniqueClients = useMemo(() => {
    const seen = new Map();
    clients.forEach(client => {
      if (!seen.has(client.mac)) seen.set(client.mac, client);
    });
    return [...seen.values()];
  }, [clients]);

  const sortedClients = useMemo(() => {
    const sorted = [...uniqueClients];
    const { field, asc } = sort;
    sorted.sort((a, b) => {
      let av = a[field] ?? '';
      let bv = b[field] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (typeof av === 'number' && isNaN(av)) av = 0;
      if (typeof bv === 'number' && isNaN(bv)) bv = 0;
      
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [uniqueClients, sort]);

  const handleSortSelect = field => {
    setSort(prev => ({
      field,
      asc: prev.field === field ? !prev.asc : true,
    }));
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2 mt-3">

        <h6 className="mb-0">Clients</h6>
        <Dropdown as={ButtonGroup}>
          <Button variant="outline-secondary" size="sm"><FiFilter /> Sortieren</Button>
          <Dropdown.Toggle split variant="outline-secondary" size="sm" />
          <Dropdown.Menu>
            {['mac', 'vendor', 'power', 'packets'].map(f => (
              <Dropdown.Item key={f} onClick={() => handleSortSelect(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)} {sort.field === f && (sort.asc ? '↑' : '↓')}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {sortedClients.length === 0 ? (
        <p><em>Keine verbundenen Clients gefunden.</em></p>
      ) : (
        sortedClients.map(client => {
          const key = `${apBssid}|${client.mac}`;
          const isInfinite = infiniteDeauths.has(key);
          const showStop = isInfinite;

          return (
            <Client
              key={key}
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
