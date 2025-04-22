import React from 'react';
import { useParams } from 'react-router-dom';
import Body from '../components/Body';
import ScanTable from '../components/ScanTable';

// Dummy-Daten pro Scan-ID
const scanResultsById = {
  1: {
    meta: {
      name: "Scan Café Mitte",
      description: "Vormittag Testlauf",
      location: "Berlin Mitte",
      timestamp: "2025-04-20 10:12"
    },
    data: [
      { bssid: "DC:39:6F:A1:93:07", essid: "FRITZ!Box 7590", channel: "6", privacy: "WPA2", power: -70 },
      { bssid: "00:18:E7:12:34:56", essid: "Cafe_Guest", channel: "11", privacy: "Open", power: -82 }
    ]
  },
  2: {
    meta: {
      name: "Uni-Netz Gebäude B",
      description: "Routine Scan",
      location: "Campus Süd",
      timestamp: "2025-04-21 09:47"
    },
    data: [
      { bssid: "3C:84:6A:62:6E:AC", essid: "eduroam", channel: "1", privacy: "WPA2", power: -45 },
      { bssid: "88:36:6C:29:2E:59", essid: "Uni-WiFi", channel: "6", privacy: "WPA2", power: -51 }
    ]
  },
  3: {
    meta: {
      name: "Home-WiFi Test",
      description: "Wohnung 5 GHz Test",
      location: "Zuhause",
      timestamp: "2025-04-18 18:30"
    },
    data: [
      { bssid: "F4:92:BF:AC:90:12", essid: "MyHomeNet", channel: "13", privacy: "WPA3", power: -39 },
      { bssid: "70:3A:73:1C:57:AE", essid: "Gastzugang", channel: "11", privacy: "Open", power: -65 }
    ]
  }
};

export default function ScanDetailPage() {
  const { scanId } = useParams();
  const scan = scanResultsById[scanId];

  if (!scan) {
    return (
      <Body sidebar>
        <h2>Scan nicht gefunden</h2>
        <p>Für die angegebene ID konnte kein Scan geladen werden.</p>
      </Body>
    );
  }

  return (
    <Body sidebar>
      <h2>{scan.meta.name}</h2>
      <p><strong>Beschreibung:</strong> {scan.meta.description}</p>
      <p><strong>Ort:</strong> {scan.meta.location}</p>
      <p><strong>Zeitpunkt:</strong> {scan.meta.timestamp}</p>

      <h4>Access Points</h4>
      <ScanTable data={scan.data} type="ap" />
    </Body>
  );
}
