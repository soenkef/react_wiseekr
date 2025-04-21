import { useState } from "react";
import Body from "../components/Body";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { useApi } from "../contexts/ApiProvider";
import { useFlash } from "../contexts/FlashProvider";

export default function ScanPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const api = useApi();
  const flash = useFlash();

  const startScan = async () => {
    setLoading(true);
    setResults([]);
    const response = await api.post("/scan");

    if (response.ok) {
      setResults(response.body);
      flash("Scan erfolgreich abgeschlossen.", "success");
    } else {
      flash("Scan fehlgeschlagen.", "danger");
    }

    setLoading(false);
  };

  return (
    <Body sidebar>
      <h2>WLAN-Scanner</h2>
      <Button onClick={startScan} disabled={loading}>
        {loading ? "Scan läuft..." : "Scan starten"}
      </Button>

      {results.length > 0 && (
        <Table striped bordered hover className="mt-3">
          <thead>
            <tr>
              <th>BSSID</th>
              <th>Channel</th>
              <th>Signal</th>
              <th>ESSID</th>
            </tr>
          </thead>
          <tbody>
            {results.map((ap, index) => (
              <tr key={index}>
                <td>{ap.bssid}</td>
                <td>{ap.channel}</td>
                <td>{ap.signal}</td>
                <td>{ap.essid}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Body>
  );
}
