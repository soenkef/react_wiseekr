import { useState } from "react";
import Button from "react-bootstrap/Button";
import Body from "../components/Body";
import { useApi } from "../contexts/ApiProvider";
import Alert from "react-bootstrap/Alert";

export default function ScanPage() {
  const api = useApi();
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    console.log("Scan gestartet");
    const response = await api.post("/scan");

    if (response.ok) {
      setOutput(response.body.output);
      setError(null);
    } else {
      setError(response.body.error || "Fehler beim Scan");
      setOutput(null);
    }
  };

  return (
    <Body sidebar>
      <h1>WLAN Scan (Test)</h1>
      <Button onClick={handleScan}>Scan starten</Button>

      {output && <Alert variant="success" className="mt-3"><pre>{output}</pre></Alert>}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </Body>
  );
}
