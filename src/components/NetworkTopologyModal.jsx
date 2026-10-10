import React, { useState } from 'react';
import { X, Network, Share2, Play, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function NetworkTopologyModal({ isOpen, onClose, peers, identity }) {
  const [animatingHop, setAnimatingHop] = useState(null);

  if (!isOpen) return null;

  const NODES_TOPOLOGY = [
    { id: 'you', label: identity?.callsign || 'YOU', role: 'Origin Node', x: 10, y: 50, isYou: true },
    { id: 'hop1', label: 'HAVEN-RELAY', role: 'Hotspot Node (Hop 1)', x: 35, y: 30 },
    { id: 'hop2', label: 'SCOUT-19', role: 'BLE Relay (Hop 2)', x: 62, y: 35 },
    { id: 'hop3', label: 'MEDIC-04', role: 'Field Medic (Hop 3)', x: 88, y: 55, isDest: true },
    { id: 'mule', label: 'CITADEL-01', role: 'Data Mule (Walking Node)', x: 50, y: 78 }
  ];

  const triggerSimulation = () => {
    setAnimatingHop(0);
    setTimeout(() => setAnimatingHop(1), 1000);
    setTimeout(() => setAnimatingHop(2), 2200);
    setTimeout(() => setAnimatingHop(3), 3400);
    setTimeout(() => setAnimatingHop(null), 4600);
  };

  return (
    <div className="modal-overlay">
      <div className="topology-modal-content">
        <div className="topology-header">
          <div className="topology-title-box">
            <Network size={20} className="icon-emerald" />
            <div>
              <div className="modal-title">HOW MESSAGES TRAVEL PHONE-TO-PHONE</div>
              <div className="modal-subtitle">See how messages hop safely between phones without internet or cell towers</div>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Interactive Diagram Area */}
        <div className="topology-canvas-wrap">
          <div className="topology-canvas">
            {/* SVG Connecting Paths */}
            <svg className="topology-svg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="10" y1="50" x2="35" y2="30" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="35" y1="30" x2="62" y2="35" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="62" y1="35" x2="88" y2="55" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="35" y1="30" x2="50" y2="78" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.6" strokeDasharray="2,2" />
              <line x1="50" y1="78" x2="88" y2="55" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.6" strokeDasharray="2,2" />
            </svg>

            {/* Nodes */}
            {NODES_TOPOLOGY.map((n, idx) => {
              const isCurrentHop = animatingHop === idx;
              return (
                <div 
                  key={n.id} 
                  className={`topology-node ${n.isYou ? 'node-you' : ''} ${n.isDest ? 'node-dest' : ''} ${isCurrentHop ? 'node-active-hop' : ''}`}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  <div className="node-icon-bubble">
                    {n.isYou ? <Zap size={14} /> : n.isDest ? <ShieldCheck size={14} /> : <Share2 size={13} />}
                  </div>
                  <div className="node-info">
                    <span className="node-label">{n.label}</span>
                    <span className="node-role">{n.role}</span>
                  </div>
                </div>
              );
            })}

            {/* Flying Packet Indicator */}
            {animatingHop !== null && (
              <div 
                className="flying-packet-tracer"
                style={{
                  left: `${NODES_TOPOLOGY[animatingHop].x}%`,
                  top: `${NODES_TOPOLOGY[animatingHop].y}%`
                }}
              >
                <div className="packet-dot"></div>
                <div className="packet-glow"></div>
                <div className="packet-badge">Hop {animatingHop + 1}</div>
              </div>
            )}
          </div>
        </div>

        {/* Controls and Explanations */}
        <div className="topology-controls-bar">
          <button 
            className="btn-run-simulation" 
            onClick={triggerSimulation}
            disabled={animatingHop !== null}
          >
            <Play size={15} />
            <span>{animatingHop !== null ? `Passing to Phone ${animatingHop + 1}...` : '▶️ Test: Watch a Message Hop Across Phones'}</span>
          </button>

          <div className="topology-stats-pill">
            <span>Duplicates Ignored: <strong>Yes</strong></span>
            <span>Reach: <strong>5 Phones</strong></span>
            <span>Delivery: <strong>Instant & Free</strong></span>
          </div>
        </div>

        <div className="topology-explainer-card">
          <div className="explainer-title">How phones talk to each other without internet:</div>
          <div className="explainer-grid">
            <div className="grid-item">
              <span className="num">1</span>
              <div>
                <strong>Direct Phone-to-Phone:</strong> Messages jump directly between phones over Bluetooth and Wi-Fi. No phone towers needed.
              </div>
            </div>
            <div className="grid-item">
              <span className="num">2</span>
              <div>
                <strong>Passed in Pockets:</strong> As people walk around, their phones quietly pass messages to each other so everyone stays informed.
              </div>
            </div>
            <div className="grid-item">
              <span className="num">3</span>
              <div>
                <strong>Saves Battery:</strong> Your phone only receives each message once, keeping your battery safe and lasting all day.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
