import React, { useState } from 'react';
import { Radio, Shield, Battery, Signal, Zap, AlertTriangle, Compass, ChevronRight } from 'lucide-react';

export default function RadarScreen({ peers, onDirectPing }) {
  const [selectedPeer, setSelectedPeer] = useState(null);

  // Map peers to deterministic angles & radii based on ID and distance
  const getPeerCoordinates = (peer, index) => {
    const angle = (index * (360 / Math.max(peers.length, 1)) + 35) * (Math.PI / 180);
    // Radius normalized between 25% and 85%
    const normalizedDist = Math.min(1, Math.max(0.15, peer.distanceMeters / 250));
    const radiusPercent = 15 + normalizedDist * 70;
    
    // Convert polar to cartesian (center is 50%, 50%)
    const x = 50 + radiusPercent * Math.cos(angle);
    const y = 50 + radiusPercent * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="radar-view-container">
      <div className="radar-header">
        <div className="radar-title-group">
          <Radio className="radar-pulse-icon" size={18} />
          <span className="radar-title">TACTICAL PROXIMITY RADAR</span>
          <span className="radar-badge">{peers.length} ACTIVE PEERS IN RANGE</span>
        </div>
        <div className="radar-legend">
          <span className="legend-item"><span className="dot dot-emergency"></span> SOS</span>
          <span className="legend-item"><span className="dot dot-relay"></span> Hotspot Relay</span>
          <span className="legend-item"><span className="dot dot-ble"></span> BLE Mesh</span>
        </div>
      </div>

      <div className="radar-main-content">
        {/* Visual Radar Scope */}
        <div className="radar-scope-wrapper">
          <div className="radar-scope">
            {/* Range Rings */}
            <div className="range-ring ring-1"><span className="ring-label">50m</span></div>
            <div className="range-ring ring-2"><span className="ring-label">120m</span></div>
            <div className="range-ring ring-3"><span className="ring-label">250m</span></div>

            {/* Crosshairs */}
            <div className="crosshair-axis vertical"></div>
            <div className="crosshair-axis horizontal"></div>

            {/* Rotating Sweep Arm */}
            <div className="radar-sweep-arm"></div>

            {/* Center Node (Local User) */}
            <div className="center-node">
              <div className="center-ping"></div>
              <div className="center-dot"></div>
              <span className="center-label">YOU</span>
            </div>

            {/* Peer Blips */}
            {peers.map((peer, idx) => {
              const { x, y } = getPeerCoordinates(peer, idx);
              const isSelected = selectedPeer?.id === peer.id;
              const isSos = peer.isEmergency;

              return (
                <button
                  key={peer.id}
                  className={`radar-blip ${isSos ? 'blip-sos' : ''} ${peer.transport === 'Hotspot Web' ? 'blip-relay' : 'blip-mesh'} ${isSelected ? 'selected' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => setSelectedPeer(peer)}
                  title={`${peer.callsign} (${peer.distanceMeters}m)`}
                >
                  <span className="blip-core"></span>
                  <span className="blip-ring"></span>
                  <span className="blip-callsign">{peer.callsign}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Peer Inspector / Peer Stream */}
        <div className="radar-sidebar">
          {selectedPeer ? (
            <div className="peer-detail-card">
              <div className="card-top">
                <div className="peer-callsign-box">
                  <span className="callsign">{selectedPeer.callsign}</span>
                  <span className="role-tag">{selectedPeer.role}</span>
                </div>
                <button className="close-btn" onClick={() => setSelectedPeer(null)}>×</button>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <Signal size={14} />
                  <div>
                    <div className="detail-label">Signal (RSSI)</div>
                    <div className="detail-val">{selectedPeer.rssi} dBm</div>
                  </div>
                </div>

                <div className="detail-item">
                  <Compass size={14} />
                  <div>
                    <div className="detail-label">Est. Distance</div>
                    <div className="detail-val">~{selectedPeer.distanceMeters} meters</div>
                  </div>
                </div>

                <div className="detail-item">
                  <Zap size={14} />
                  <div>
                    <div className="detail-label">Transport</div>
                    <div className="detail-val">{selectedPeer.transport}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <Battery size={14} />
                  <div>
                    <div className="detail-label">Node Battery</div>
                    <div className="detail-val">{selectedPeer.battery}%</div>
                  </div>
                </div>
              </div>

              {selectedPeer.isEmergency && (
                <div className="peer-emergency-alert">
                  <AlertTriangle size={15} />
                  <span>EMERGENCY BEACON ACTIVE ON THIS NODE</span>
                </div>
              )}

              <button 
                className="btn-ping-peer"
                onClick={() => onDirectPing && onDirectPing(selectedPeer)}
              >
                <span>Send Encrypted Ping</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="peer-list-container">
              <div className="peer-list-header">Detected Mesh Nodes</div>
              <div className="peer-list-scroll">
                {peers.map(peer => (
                  <div 
                    key={peer.id} 
                    className="peer-list-row"
                    onClick={() => setSelectedPeer(peer)}
                  >
                    <div className="row-left">
                      <span className={`status-dot ${peer.isEmergency ? 'sos' : 'ok'}`}></span>
                      <div>
                        <div className="row-callsign">{peer.callsign}</div>
                        <div className="row-role">{peer.role} • {peer.transport}</div>
                      </div>
                    </div>
                    <div className="row-right">
                      <div className="row-dist">~{peer.distanceMeters}m</div>
                      <div className="row-rssi">{peer.rssi} dBm</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
