import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Body from "../components/Body";
import { useApi } from "../contexts/ApiProvider";

export default function ScanStreamPage() {
  const api = useApi();
  const [command, setCommand] = useState("whoami");
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async (e) => {
    e.preventDefault();
    console.log("Starte Befehl:", command);

    const response = await api.post("/scan", { command });

    if (response.ok) {
      setOutput(response.body.output);
      setError(null);
    } else {
      setError(response.body.error || "Fehler beim Ausführen");
      setOutput(null);
    }
  };

  return (
    <Body sidebar>
      <h1>Kommando ausführen</h1>
      <Form onSubmit={handleRun}>
        <Form.Group className="mb-3">
          <Form.Label>Befehl</Form.Label>
          <Form.Control
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="z. B. whoami, ls -la, uname -a"
          />
        </Form.Group>
        <Button type="submit">Ausführen</Button>
      </Form>

      {output && <Alert variant="success" className="mt-3"><pre>{output}</pre></Alert>}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </Body>
  );
}
