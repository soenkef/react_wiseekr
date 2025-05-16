// ScanDetailPage.js (API Integration)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../contexts/ApiProvider';
import { useFlash } from '../contexts/FlashProvider';
import Body from '../components/Body';
import AccessPoints from '../components/AccessPoints';
import UnlinkedClients from '../components/UnlinkedClients';
import ScanHeader from '../components/ScanHeader';
import { DeauthModal, RescanModal } from '../components/Modals';

export default function ScanDetailPage() {
    const { id } = useParams();
    const scanId = parseInt(id, 10);
    const navigate = useNavigate();
    const api = useApi();
    const flash = useFlash();

    const [scan, setScan] = useState(null);
    const [showDeauthModal, setShowDeauthModal] = useState(false);
    const [showRescanModal, setShowRescanModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            const response = await api.get(`/scans/${scanId}`);
            if (response.ok) setScan(response.body);
            else flash('Scan nicht gefunden', 'danger');
        };
        if (scanId) load();
    }, [scanId, api, flash]);

    const handleDeauth = async (options) => {
        try {
            const response = await api.post(`/deauth/start`, {
                scan_id: scanId,
                packets: options.packets,
                duration: options.duration
            });
            if (response.ok) flash('Deauth erfolgreich gestartet', 'success');
            else throw new Error(response.body?.error || 'Deauth fehlgeschlagen');
        } catch (error) {
            flash(error.message, 'danger');
        }
    };

    const handleRescan = async (options) => {
        try {
            const response = await api.post(`/scans/${scanId}/rescan`, {
                duration: options.duration
            });
            if (response.ok) flash('Rescan erfolgreich gestartet', 'success');
            else throw new Error(response.body?.error || 'Rescan fehlgeschlagen');
        } catch (error) {
            flash(error.message, 'danger');
        }
    };

    if (!scan) return <Body><p>Lade Scan-Daten...</p></Body>;

    return (
        <Body>
            <button onClick={() => navigate('/scans')}>Zurück zur Übersicht</button>
            <ScanHeader scan={scan} />
            <AccessPoints scan={scan} onDeauth={() => setShowDeauthModal(true)} onRescan={() => setShowRescanModal(true)} />
            <UnlinkedClients scan={scan} />
            <DeauthModal show={showDeauthModal} onHide={() => setShowDeauthModal(false)} onSubmit={handleDeauth} />
            <RescanModal show={showRescanModal} onHide={() => setShowRescanModal(false)} onSubmit={handleRescan} />
        </Body>
    );
}
