import React from 'react';
import ScanTable from '../components/ScanTable';
import Body from '../components/Body';

const accessPoints = [
  {
    bssid: "DC:39:6F:A1:93:07",
    essid: "FRITZ!Powerline 1260E",
    channel: "11",
    privacy: "WPA2",
    power: -88
  },
  {
    bssid: "04:D4:C4:3F:9B:90",
    essid: "NETGEAR32",
    channel: "6",
    privacy: "WPA2",
    power: -70
  },
  {
    bssid: "88:36:6C:29:2E:59",
    essid: "TP-LINK_2E59",
    channel: "1",
    privacy: "WPA",
    power: -60
  },
  {
    bssid: "3C:84:6A:62:6E:AC",
    essid: "eduroam",
    channel: "11",
    privacy: "WPA2",
    power: -45
  },
  {
    bssid: "00:18:E7:12:34:56",
    essid: "Guest_WiFi",
    channel: "6",
    privacy: "Open",
    power: -72
  }
];

export default function ScanResultsPage() {
  return (
    <Body sidebar>
      <h2>Scan-Ergebnisse (Access Points)</h2>
      <ScanTable data={accessPoints} type="ap" />
    </Body>
  );
}