// AccessPointGraph.js
import React from 'react';
import { FiAlertTriangle, FiLock, FiUnlock, FiDownload } from 'react-icons/fi';

export default function AccessPointGraph({ ap }) {
  const centerX = 150;
  const centerY = 150;
  const radius = 100;

  const clientCount = ap.clients.length;
  const angleStep = (2 * Math.PI) / clientCount;

  const getClientPosition = (index) => {
    const angle = index * angleStep;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  return (
    <div className="accesspoint-graph-wrapper mb-4">
      <svg width="300" height="300" className="bg-light rounded shadow-sm">
        {/* Linien zu Clients */}
        {ap.clients.map((client, i) => {
          const { x, y } = getClientPosition(i);
          return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#ccc" />;
        })}

        {/* Clients */}
        {ap.clients.map((client, i) => {
          const { x, y } = getClientPosition(i);
          return (
            <g key={client.mac} transform={`translate(${x}, ${y})`} className="client-node">
              <circle r="16" fill={client.is_camera ? '#ffc107' : '#007bff'} />
              <title>{client.mac} – Power: {client.power} dBm</title>
            </g>
          );
        })}

        {/* Zentraler Access Point */}
        <g transform={`translate(${centerX}, ${centerY})`} className="accesspoint-node">
          <circle r="28" fill={ap.cracked_password ? '#28a745' : '#6c757d'} />
          <text
            textAnchor="middle"
            dy=".3em"
            fontSize="10"
            fill="white"
          >
            {ap.essid?.slice(0, 6) || '<AP>'}
          </text>
          <title>{ap.essid} – Power: {ap.power} dBm</title>
        </g>
      </svg>

      {/* Legende / Infos */}
      <div className="mt-3 small text-muted px-2">
        <strong>SSID:</strong> {ap.essid || '<Hidden>'} <br />
        <strong>Power:</strong> {ap.power} dBm <br />
        <strong>Clients:</strong> {ap.clients.length} <br />
        {ap.is_camera && <span className="text-warning"><FiAlertTriangle /> Kamera erkannt</span>} <br />
        {ap.handshake_file && <span><FiDownload className="me-1" /> Handshake vorhanden</span>} <br />
        {ap.cracked_password
          ? <span className="text-success"><FiUnlock /> Passwort: {ap.cracked_password}</span>
          : <span><FiLock /> verschlüsselt</span>
        }
      </div>
    </div>
  );
}
