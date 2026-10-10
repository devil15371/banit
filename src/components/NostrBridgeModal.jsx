import React, { useState, useEffect } from 'react';
import { X, Globe, Radio, Shield, MapPin, Zap, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { nostrBridge } from '../services/nostrBridge';
import { TACTICAL_GEOHASH_ZONES, getGeohashChannelName } from '../services/geohashChannels';

export default function NostrBridgeModal({ isOpen, onClose, onSelectGeohashChannel }) {
  const [nostrStatus, setNostrStatus] = useState(nostrBridge.getStatus());

  useEffect(() => {
    if (isOpen) {
      setNostrStatus(nostrBridge.getStatus());
      nostrBridge.onStatusChange = (status) => setNostrStatus(status);
    }
    return () => {
      nostrBridge.onStatusChange = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="nostr-modal-content">
        <div className="nostr-header">
          <div className="nostr-title-box">
            <Globe size={22} className="icon-purple" />
            <div>
              <div className="modal-title">BITCHAT NOSTR & GEOHASH GLOBAL BRIDGE</div>
              <div className="modal-subtitle">Dual-transport protocol: Offline local mesh linked to censorship-resistant Nostr relays</div>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Dual Transport Visual Architecture */}
        <div className="dual-transport-card">
          <div className="dt-row">
            <div className="dt-col mesh-col">
              <Radio size={16} className="text-emerald" />
              <div>
                <strong>Local Blackout Zone (Zero-Internet)</strong>
                <p>Hotspot Web + BLE + Ultrasonic Audio Modems</p>
              </div>
            </div>

            <div className="dt-arrow">
              <ArrowRightLeft size={16} />
              <span>Perimeter Bridge</span>
            </div>

            <div className="dt-col nostr-col">
              <Globe size={16} className="text-purple" />
              <div>
                <strong>Global Nostr Fallback (Internet / Starlink)</strong>
                <p>Decentralized relays broadcast world alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nostr Relay Status */}
        <div className="relay-status-section">
          <div className="section-heading">Connected Nostr Relays ({nostrStatus.connectedRelays}/{nostrStatus.totalRelays})</div>
          <div className="relay-list">
            {nostrStatus.relayList.map((relayUrl, idx) => (
              <div key={idx} className="relay-item">
                <div className="relay-url-wrap">
                  <span className={`relay-dot ${nostrStatus.isOnline ? 'online' : 'offline'}`}></span>
                  <code>{relayUrl}</code>
                </div>
                <span className="relay-badge">
                  {nostrStatus.isOnline ? 'Bridge Ready' : 'Awaiting Perimeter Signal'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Geohash Location Channels (from BitChat) */}
        <div className="geohash-section">
          <div className="section-heading">
            <MapPin size={14} className="text-cyan" />
            <span>BitChat Geohash Crisis Channels (Location without GPS Leaks)</span>
          </div>
          <div className="geohash-grid">
            {TACTICAL_GEOHASH_ZONES.map(zone => {
              const chName = getGeohashChannelName(zone.geohash);
              return (
                <button
                  key={zone.geohash}
                  className="geohash-btn"
                  onClick={() => {
                    onSelectGeohashChannel(chName);
                    onClose();
                  }}
                >
                  <div className="geo-top">
                    <span className="geo-code">{zone.geohash.toUpperCase()}</span>
                    <span className="geo-channel">{chName}</span>
                  </div>
                  <div className="geo-name">{zone.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="nostr-footer-note">
          <Shield size={13} className="text-emerald" />
          <span>Compatible with BitChat's private envelope relay specification and Nostr NIP-01 decentralized relays.</span>
        </div>
      </div>
    </div>
  );
}
