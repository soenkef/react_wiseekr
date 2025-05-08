import WifiConnectSection from '../components/WifiConnectSection';
import { useState } from 'react';
import Body from '../components/Body';

export default function SettingsPage() {
  const [savedSetting, setSavedSetting] = useState({ ssid: '', force_connect: false });

  return (
    <Body sidebar>
      <h2>Netzwerk-Einstellungen</h2>
      <WifiConnectSection
        savedSetting={savedSetting}
        onSavedSettingChange={setSavedSetting}
      />
      <hr />
    </Body>
  );
}