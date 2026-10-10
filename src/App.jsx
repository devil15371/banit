import React, { useState, useEffect } from 'react';
import { 
  Radio, Shield, AlertTriangle, Send, Wifi, WifiOff, Users, 
  Activity, Share2, EyeOff, Trash2, Lock, Volume2, Network,
  CheckCircle2, Clock, ChevronRight, Zap, Filter, Bell, Globe
} from 'lucide-react';

import { meshEngine } from './services/meshEngine';
import DecoyCalculator from './components/DecoyCalculator';
import RadarScreen from './components/RadarScreen';
import UltrasonicVisualizer from './components/UltrasonicVisualizer';
import SosModal from './components/SosModal';
import NetworkTopologyModal from './components/NetworkTopologyModal';
import ShareNodeModal from './components/ShareNodeModal';
import NostrBridgeModal from './components/NostrBridgeModal';
import InstallAppModal from './components/InstallAppModal';
import LiveStreamModal from './components/LiveStreamModal';
import EvidenceCameraModal from './components/EvidenceCameraModal';
import { Smartphone, Video, Camera } from 'lucide-react';

export default function App() {
  const [inDecoyMode, setInDecoyMode] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'radar' | 'acoustic'
  const [selectedChannel, setSelectedChannel] = useState('#all-mesh');
  const [inputText, setInputText] = useState('');
  const [inputPriority, setInputPriority] = useState('NORMAL'); // 'NORMAL' | 'HIGH' | 'CRITICAL_SOS'
  
  // Mesh state
  const [meshData, setMeshData] = useState({
    messages: meshEngine.messages,
    peers: meshEngine.peers,
    identity: meshEngine.identity,
    stats: meshEngine.packetStats,
    isWsConnected: meshEngine.isWsConnected
  });

  // Modals
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isTopologyOpen, setIsTopologyOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNostrOpen, setIsNostrOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [wipeAlert, setWipeAlert] = useState(false);

  useEffect(() => {
    const unsubscribe = meshEngine.subscribe(setMeshData);
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut: Press Escape twice to immediately switch to stealth decoy
  useEffect(() => {
    let lastEsc = 0;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 500) {
          setInDecoyMode(true);
        }
        lastEsc = now;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    meshEngine.broadcastMessage(
      inputText, 
      selectedChannel, 
      inputPriority, 
      inputPriority === 'CRITICAL_SOS' ? ['SOS'] : []
    );
    setInputText('');
    setInputPriority('NORMAL');
  };

  const handleDispatchSos = (sosText, tag) => {
    meshEngine.broadcastMessage(sosText, '#sos-beacon', 'CRITICAL_SOS', [tag, 'EMERGENCY']);
    setSelectedChannel('#sos-beacon');
  };

  const handlePanicWipe = () => {
    if (window.confirm("CONFIRM ZEROIZATION: This will immediately destroy all encryption keys, message histories, and identity fingerprints on this device.")) {
      meshEngine.wipeAllData();
      setWipeAlert(true);
      setTimeout(() => setWipeAlert(false), 3000);
      setInDecoyMode(true); // Jump to decoy
    }
  };

  // If decoy calculator mode is active, render the decoy interface
  if (inDecoyMode) {
    return (
      <DecoyCalculator 
        onUnlockMesh={() => setInDecoyMode(false)}
        onDuressWipe={() => meshEngine.wipeAllData()}
      />
    );
  }

  // Filter messages for current channel
  const filteredMessages = meshData.messages.filter(msg => {
    if (selectedChannel === '#all-mesh') return true;
    return msg.channel === selectedChannel;
  });

  const CHANNELS = [
    { id: '#all-mesh', label: 'All Mesh', count: meshData.messages.length },
    { id: '#sos-beacon', label: '🚨 SOS Beacon', count: meshData.messages.filter(m => m.channel === '#sos-beacon').length },
    { id: '#checkpoints', label: '🛡️ Checkpoints', count: meshData.messages.filter(m => m.channel === '#checkpoints').length },
    { id: '#medical-aid', label: '💊 Medical Aid', count: meshData.messages.filter(m => m.channel === '#medical-aid').length }
  ];

  // If a geohash channel is active that isn't standard, add it to channels list
  if (selectedChannel.startsWith('#geo-') && !CHANNELS.some(c => c.id === selectedChannel)) {
    CHANNELS.push({
      id: selectedChannel,
      label: `📍 ${selectedChannel}`,
      count: meshData.messages.filter(m => m.channel === selectedChannel).length
    });
  }

  return (
    <div className="haven-app-root">
      {/* Top Tactical Status Bar */}
      <header className="tactical-navbar">
        <div className="nav-brand-section">
          <div className="brand-logo-wrap" onClick={() => setInDecoyMode(true)} title="Tap 3 times or press Esc twice for Stealth Decoy">
            <Shield className="brand-icon" size={20} />
            <div className="brand-ping-dot"></div>
          </div>
          <div>
            <div className="brand-title">HAVEN MESH <span className="brand-version">v2.4</span></div>
            <div className="brand-sub">ZERO-INFRASTRUCTURE CRISIS NETWORK</div>
          </div>
        </div>

        {/* Network & Identity Health */}
        <div className="nav-telemetry-cluster">
          <div className="telemetry-pill">
            <span className="dot-live"></span>
            <span className="pill-label">NODE:</span>
            <span className="pill-val">{meshData.identity.callsign}</span>
          </div>

          <div className="telemetry-pill">
            <Radio size={13} className="text-emerald" />
            <span className="pill-label">PEERS:</span>
            <span className="pill-val">{meshData.peers.length} IN RANGE</span>
          </div>

          <div className="telemetry-pill">
            <Network size={13} className="text-cyan" />
            <span className="pill-label">RELAY HOPS:</span>
            <span className="pill-val">{meshData.stats.relayed} PACKETS</span>
          </div>

          <div className={`telemetry-pill ${meshData.isWsConnected ? 'hotspot-active' : ''}`}>
            {meshData.isWsConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="pill-val">{meshData.isWsConnected ? 'LOCAL HOTSPOT ACTIVE' : 'BLE MESH MODE'}</span>
          </div>
        </div>

        {/* Tactical Actions */}
        <div className="nav-action-buttons">
          <button className="btn-nav-sos" onClick={() => setIsSosOpen(true)}>
            <AlertTriangle size={15} />
            <span>SOS BEACON</span>
          </button>

          <button className="btn-nav-action cam-glow-btn" onClick={() => setIsCameraOpen(true)} title="Capture Photos & Videos with Automatic Swarm Backup">
            <Camera size={15} className="text-emerald" />
            <span className="hide-on-mobile">Evidence Cam</span>
          </button>

          <button className="btn-nav-action live-pulse-btn" onClick={() => setIsLiveOpen(true)} title="Go Live on YouTube / Reddit via Swarm Relay">
            <Video size={15} className="text-red" />
            <span className="hide-on-mobile">🔴 YouTube Live</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsInstallOpen(true)} title="Install on iPhone or Android">
            <Smartphone size={15} className="text-emerald" />
            <span className="hide-on-mobile">Install App</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsShareOpen(true)} title="Zero-Install QR code for peers">
            <Share2 size={15} />
            <span className="hide-on-mobile">Zero-Install Beam</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsNostrOpen(true)} title="BitChat Nostr Global Bridge & Geohash Channels">
            <Globe size={15} className="text-purple" />
            <span className="hide-on-mobile">Nostr Bridge</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsTopologyOpen(true)} title="Inspect Multi-Hop Swarm">
            <Network size={15} />
            <span className="hide-on-mobile">DTN Swarm</span>
          </button>

          <button className="btn-nav-action stealth-btn" onClick={() => setInDecoyMode(true)} title="Activate Decoy Calculator (Shortcut: Esc 2x)">
            <EyeOff size={15} />
            <span className="hide-on-mobile">Decoy</span>
          </button>

          <button className="btn-nav-danger" onClick={handlePanicWipe} title="Instant Forensic Zeroization">
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {wipeAlert && (
        <div className="zeroize-banner">
          <Shield size={16} />
          <span>FORENSIC ZEROIZATION COMPLETE: ALL ENCRYPTED KEYS AND LOGS DESTROYED</span>
        </div>
      )}

      {/* Main Container */}
      <div className="haven-main-body">
        {/* Navigation View Switcher (Tabs) */}
        <div className="view-mode-bar">
          <div className="view-tabs">
            <button 
              className={`view-tab ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <Users size={15} />
              <span>Mesh Stream</span>
            </button>
            <button 
              className={`view-tab ${activeTab === 'radar' ? 'active' : ''}`}
              onClick={() => setActiveTab('radar')}
            >
              <Radio size={15} />
              <span>Proximity Radar ({meshData.peers.length})</span>
            </button>
            <button 
              className={`view-tab ${activeTab === 'acoustic' ? 'active' : ''}`}
              onClick={() => setActiveTab('acoustic')}
            >
              <Volume2 size={15} />
              <span>Anti-Jam Acoustic Modem</span>
            </button>
          </div>

          <div className="anti-censor-badge">
            <Shield size={12} />
            <span>NO SIM • NO CELL TOWER • NO INTERNET NEEDED</span>
          </div>
        </div>

        {/* View 1: Mesh Feed */}
        {activeTab === 'feed' && (
          <div className="feed-layout">
            {/* Left Channel Sidebar */}
            <aside className="channel-sidebar">
              <div className="sidebar-section-title">ACTIVE CHANNELS</div>
              <div className="channel-list">
                {CHANNELS.map(ch => (
                  <button 
                    key={ch.id}
                    className={`channel-pill ${selectedChannel === ch.id ? 'active' : ''}`}
                    onClick={() => setSelectedChannel(ch.id)}
                  >
                    <span className="ch-name">{ch.label}</span>
                    <span className="ch-count">{ch.count}</span>
                  </button>
                ))}
              </div>

              {/* Swarm Quick Stats */}
              <div className="swarm-stats-card">
                <div className="stats-header">TACTICAL SWARM TELEMETRY</div>
                <div className="stats-row">
                  <span>Packets Relayed:</span>
                  <strong>{meshData.stats.relayed}</strong>
                </div>
                <div className="stats-row">
                  <span>Deduplicated Loops:</span>
                  <strong>{meshData.stats.droppedDuplicates}</strong>
                </div>
                <div className="stats-row">
                  <span>Max Hop Depth:</span>
                  <strong>5 hops</strong>
                </div>
                <div className="stats-row">
                  <span>Transport:</span>
                  <strong className="text-emerald">Hybrid BLE + Web</strong>
                </div>
              </div>

              {/* Offline Field Guidance */}
              <div className="field-guide-card">
                <div className="guide-title">Field Security Notice:</div>
                <p>Triple-tap the Haven Shield logo or press <code>Escape</code> twice if inspected by police to instantly switch to the Decoy Calculator.</p>
              </div>
            </aside>

            {/* Center Messages Column */}
            <main className="messages-container">
              <div className="channel-header-bar">
                <div className="ch-title-wrap">
                  <span className="active-ch-name">{selectedChannel}</span>
                  <span className="active-ch-sub">Delay-Tolerant Multi-Hop Broadcast</span>
                </div>
                <div className="crypto-badge">
                  <Lock size={12} />
                  <span>EPHEMERAL E2E ENCRYPTED</span>
                </div>
              </div>

              {/* Messages Scroll Feed */}
              <div className="messages-stream">
                {filteredMessages.length === 0 ? (
                  <div className="empty-messages-placeholder">
                    <Radio size={32} className="pulse-empty" />
                    <div className="empty-title">Channel is silent</div>
                    <div className="empty-sub">Send a message or SOS to broadcast across the crowd mesh</div>
                  </div>
                ) : (
                  filteredMessages.map(msg => {
                    const isSos = msg.priority === 'CRITICAL_SOS';
                    const isHigh = msg.priority === 'HIGH';
                    const isMine = msg.authorId === meshData.identity.id;

                    return (
                      <div 
                        key={msg.id} 
                        className={`message-card ${isSos ? 'msg-sos' : ''} ${isHigh ? 'msg-high' : ''} ${isMine ? 'msg-mine' : ''}`}
                      >
                        <div className="msg-header">
                          <div className="author-wrap">
                            <span className={`author-badge ${isMine ? 'mine' : ''}`}>{msg.author}</span>
                            <span className="author-fingerprint">{msg.authorId}</span>
                            {msg.tags && msg.tags.map((t, i) => (
                              <span key={i} className="msg-tag">[{t}]</span>
                            ))}
                          </div>
                          <div className="msg-meta">
                            <span className="msg-hops">{msg.hops} {msg.hops === 1 ? 'hop' : 'hops'}</span>
                            <span className="msg-transport">{msg.transport.replace('_', ' ')}</span>
                            <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="msg-body">{msg.text}</div>

                        {isSos && (
                          <div className="sos-priority-footer">
                            <AlertTriangle size={13} />
                            <span>PRIORITY QUEUE: Universal store-and-forward relay override</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Broadcast Input Box */}
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <div className="input-priority-bar">
                  <span className="priority-label">Priority:</span>
                  <button 
                    type="button" 
                    className={`priority-btn ${inputPriority === 'NORMAL' ? 'active' : ''}`}
                    onClick={() => setInputPriority('NORMAL')}
                  >
                    Normal
                  </button>
                  <button 
                    type="button" 
                    className={`priority-btn priority-high ${inputPriority === 'HIGH' ? 'active' : ''}`}
                    onClick={() => setInputPriority('HIGH')}
                  >
                    High
                  </button>
                  <button 
                    type="button" 
                    className={`priority-btn priority-sos ${inputPriority === 'CRITICAL_SOS' ? 'active' : ''}`}
                    onClick={() => setInputPriority('CRITICAL_SOS')}
                  >
                    Critical SOS
                  </button>
                </div>

                <div className="input-row">
                  <input 
                    type="text" 
                    className="mesh-text-input"
                    placeholder={`Transmit message to ${selectedChannel}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button type="submit" className="btn-send-mesh" disabled={!inputText.trim()}>
                    <Send size={15} />
                    <span>Broadcast</span>
                  </button>
                </div>
              </form>
            </main>
          </div>
        )}

        {/* View 2: Tactical Proximity Radar */}
        {activeTab === 'radar' && (
          <RadarScreen 
            peers={meshData.peers} 
            onDirectPing={(peer) => {
              meshEngine.broadcastMessage(`Direct ping to ${peer.callsign}`, '#all-mesh', 'NORMAL');
              setActiveTab('feed');
            }}
          />
        )}

        {/* View 3: Acoustic / Ultrasonic Modem */}
        {activeTab === 'acoustic' && (
          <UltrasonicVisualizer 
            onAcousticPacketSent={(text) => {
              meshEngine.broadcastMessage(text, '#all-mesh', 'HIGH', ['ACOUSTIC'], 'ACOUSTIC_ULTRASONIC');
            }}
          />
        )}
      </div>

      {/* Modals */}
      <SosModal 
        isOpen={isSosOpen} 
        onClose={() => setIsSosOpen(false)}
        onDispatchSos={handleDispatchSos}
      />

      <NetworkTopologyModal 
        isOpen={isTopologyOpen}
        onClose={() => setIsTopologyOpen(false)}
        peers={meshData.peers}
        identity={meshData.identity}
      />

      <ShareNodeModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <NostrBridgeModal 
        isOpen={isNostrOpen}
        onClose={() => setIsNostrOpen(false)}
        onSelectGeohashChannel={(geoCh) => setSelectedChannel(geoCh)}
      />

      <InstallAppModal 
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      <LiveStreamModal 
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
        onPanicToDecoy={() => {
          setIsLiveOpen(false);
          setInDecoyMode(true);
        }}
      />

      <EvidenceCameraModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPanicToDecoy={() => {
          setIsCameraOpen(false);
          setInDecoyMode(true);
        }}
      />
    </div>
  );
}
