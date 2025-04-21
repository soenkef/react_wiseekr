import Body from "../components/Body";
import { useApi } from "../contexts/ApiProvider";
import TestBash from "../components/TestBash";
import { useEffect } from "react";

export default function RunScriptPage() {
    const api = useApi();

    useEffect(() => {
        (async () => {
          const response = await api.get('/run-script');
          if (response.ok) {
            console.log(response.body.data);
          }
          else {
            console.error("Error fetching script data:", response);
          }
        })();
      }, [api]);

    return (
        <Body sidebar>
            <TestBash />
        </Body>
    );
}