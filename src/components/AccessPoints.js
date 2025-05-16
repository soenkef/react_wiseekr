// AccessPoints.js
import React from 'react';
import AccessPoint from './AccessPoint';

export default function AccessPoints({ scan }) {
    return (
        <div>
            <h4>Access Points</h4>
            {scan.access_points.map(ap => (
                <AccessPoint key={ap.bssid} ap={ap} />
            ))}
        </div>
    );
}
