// src/components/testData.js

// 1) Test-Scans (5 Scans)
export const testScans = [
  { id: 1, timestamp: '2025-05-01T10:00:00Z', duration: 120, channel: 11, pan_id: '0x1A2B', description: 'Wohnzimmer', filename: 'scan1.pcap' },
  { id: 2, timestamp: '2025-05-02T11:30:00Z', duration: 180, channel: 15, pan_id: '0x2B3C', description: 'Küche',      filename: 'scan2.pcap' },
  { id: 3, timestamp: '2025-05-03T09:15:00Z', duration:  90, channel: 20, pan_id: '0x3C4D', description: 'Büro',       filename: 'scan3.pcap' },
  { id: 4, timestamp: '2025-05-04T14:45:00Z', duration: 240, channel: 25, pan_id: '0x4D5E', description: 'Flur',       filename: 'scan4.pcap' },
  { id: 5, timestamp: '2025-05-05T16:20:00Z', duration: 300, channel: 26, pan_id: '0x5E6F', description: 'Garten',     filename: 'scan5.pcap' },
];

// 2) Test-Zigbee-Geräte (20 Devices)
export const testDevices = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1;
  const macPrefixes = ['00:0d:6f','00:12:4b','00:17:88','00:1a:c2'];
  const manufs      = ['Philips','Xiaomi','IKEA','OSRAM'];
  const models       = ['Sensor','Bulb','Switch','Thermostat'];
  const types        = ['Sensor','Light','Switch','Climate'];

  const prefix = macPrefixes[i % macPrefixes.length];
  return {
    id,
    ieee_addr: `${prefix}:ff:fe:ab:cd:${id.toString(16).padStart(2,'0')}`,
    network_addr: `0x${(0x1000 + id).toString(16)}`,
    manufacturer: manufs[i % manufs.length],
    model: models[i % models.length],
    device_type: types[i % types.length],
    counter: Math.floor(Math.random() * 10),
  };
});

// 3) Test-Scan-Geräte (4 Devices pro Scan → insgesamt 20 Einträge)
export const testScanDevices = testScans.flatMap(scan => {
  const sliceStart = (scan.id - 1) * 4;
  return testDevices.slice(sliceStart, sliceStart + 4).map(dev => ({
    id: scan.id * 100 + dev.id,        // eindeutige Zuordnungs-ID
    scan_id: scan.id,                  // Verknüpfung zum Scan
    device_id: dev.id,                 // Verknüpfung zum Device
    first_seen: new Date(Date.parse(scan.timestamp) + 5_000).toISOString(),
    last_seen:  new Date(Date.parse(scan.timestamp) + (scan.duration - 5) * 1_000).toISOString(),
    rssi:      -30 - Math.floor(Math.random() * 40),   // -30 bis -70
    lqi:       100 + Math.floor(Math.random() * 50),   // 100 bis 150
    profile_id: ['0x0104','0x0103','0x0101','0x0100'][dev.id % 4],
    endpoint:  (dev.id % 4) + 1,
  }));
});
