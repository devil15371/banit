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
    if (window.confirm("CLEAR ALL MESSAGES: This will delete all message history and saved items from this device immediately.")) {
      meshEngine.wipeAllData();
      setWipeAlert(true);
      setTimeout(() => setWipeAlert(false), 3000);
      setInDecoyMode(true); // Jump to decoy
    }
  };

  // Helper functions for user-friendly labels
  const formatTransport = (transport) => {
    if (!transport) return 'Direct';
    const t = String(transport).toUpperCase();
    if (t.includes('HOTSPOT') || t.includes('WI-FI') || t.includes('WIFI')) return 'Wi-Fi';
    if (t.includes('BLE') || t.includes('BLUETOOTH')) return 'Bluetooth';
    if (t.includes('ACOUSTIC') || t.includes('ULTRASONIC') || t.includes('SOUND')) return 'Sound Waves';
    if (t.includes('NOSTR')) return 'Web Backup';
    return 'Direct';
  };

  const formatHops = (hops) => {
    if (!hops || hops === 0 || hops === 1) return 'Direct connection';
    if (hops === 2) return 'Passed through 1 phone';
    return `Passed through ${hops - 1} phones`;
  };

  const formatTag = (tag) => {
    switch (tag) {
      case 'LIVE_VIDEO': return '🔴 Live Stream';
      case 'YOUTUBE': return 'YouTube';
      case 'REDDIT': return 'Reddit';
      case 'TWITCH': return 'Twitch';
      case 'EVIDENCE_SWARM': return '📸 Evidence Backup';
      case 'DETENTION_ALERT': return '🚨 Safety Alert';
      case 'MEDICAL':
      case 'FIRST_AID': return '💊 First Aid';
      case 'POLICE':
      case 'BARRICADE': return '🛡️ Police Alert';
      case 'NET_SHUTDOWN': return '📶 Offline Notice';
      case 'SOS': return '🚨 Emergency';
      default: return tag;
    }
  };

  const renderMessageContent = (msg) => {
    const isLiveStream = msg.tags?.includes('LIVE_VIDEO') || msg.text.startsWith('[LIVE_STREAM_BURST]') || msg.text.includes('Live video streaming');
    const isEvidence = msg.tags?.includes('EVIDENCE_SWARM') || msg.text.startsWith('[SWARM_EVIDENCE_BURST]') || msg.text.includes('Backing up photo/video');
    const isDetention = msg.tags?.includes('DETENTION_ALERT') || msg.text.startsWith('[EMERGENCY DETENTION]') || msg.text.includes('Streamer closed camera');

    if (isLiveStream) {
      return (
        <div className="special-msg-card live-card">
          <div className="special-card-header">
            <span className="dot-pulse-red"></span>
            <strong>🔴 Live Video Streaming to YouTube</strong>
          </div>
          <p className="special-card-text">
            {msg.text.replace(/\[LIVE_STREAM_BURST\]\s*/i, '').replace(/Target:\s*/i, 'Platform: ')}
          </p>
          <div className="special-card-footer">
            <span>Video is hopping phone-to-phone across the crowd to reach YouTube • Not stored on this phone</span>
          </div>
        </div>
      );
    }

    if (isEvidence) {
      return (
        <div className="special-msg-card evidence-card">
          <div className="special-card-header">
            <Shield size={14} className="text-emerald" />
            <strong>📸 Photo/Video Proof Backed Up</strong>
          </div>
          <p className="special-card-text">
            {msg.text.replace(/\[SWARM_EVIDENCE_BURST\]\s*/i, '')}
          </p>
          <div className="special-card-footer">
            <span>Copied safely to nearby phones so it cannot be lost even if this phone is taken</span>
          </div>
        </div>
      );
    }

    if (isDetention) {
      return (
        <div className="special-msg-card alert-card">
          <div className="special-card-header">
            <AlertTriangle size={14} className="text-red" />
            <strong>🚨 Safety Alert: App Disguised</strong>
          </div>
          <p className="special-card-text">
            {msg.text.replace(/\[EMERGENCY DETENTION\]\s*/i, '')}
          </p>
        </div>
      );
    }

    return <div className="msg-body">{msg.text}</div>;
  };

  const getChannelSubtitle = (channelId) => {
    switch (channelId) {
      case '#all-mesh': return 'Chat with everyone nearby without internet';
      case '#sos-beacon': return 'Emergency alerts broadcasted to all nearby phones';
      case '#checkpoints': return 'Police checkpoints, barricades & safe paths';
      case '#medical-aid': return 'First aid stations, medical supplies & drinking water';
      default: return 'Broadcast to all nearby phones';
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
    { id: '#all-mesh', label: '💬 Everyone Nearby', count: meshData.messages.length },
    { id: '#sos-beacon', label: '🚨 Emergency SOS', count: meshData.messages.filter(m => m.channel === '#sos-beacon').length },
    { id: '#checkpoints', label: '🛡️ Police & Safe Paths', count: meshData.messages.filter(m => m.channel === '#checkpoints').length },
    { id: '#medical-aid', label: '💊 First Aid & Water', count: meshData.messages.filter(m => m.channel === '#medical-aid').length }
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
      {/* Top Status Bar */}
      <header className="tactical-navbar">
        <div className="nav-brand-section">
          <div className="brand-logo-wrap" onClick={() => setInDecoyMode(true)} title="Tap to hide app with calculator">
            <Shield className="brand-icon" size={20} />
            <div className="brand-ping-dot"></div>
          </div>
          <div>
            <div className="brand-title">HAVEN</div>
            <div className="brand-sub">WORKS WITHOUT INTERNET OR SIM</div>
          </div>
        </div>

        {/* Network & Identity Health */}
        <div className="nav-telemetry-cluster">
          <div className="telemetry-pill">
            <span className="dot-live"></span>
            <span className="pill-label">You:</span>
            <span className="pill-val">{meshData.identity.callsign}</span>
          </div>

          <div className="telemetry-pill">
            <Users size={13} className="text-emerald" />
            <span className="pill-val">{meshData.peers.length} Nearby Phones</span>
          </div>

          <div className="telemetry-pill">
            <Zap size={13} className="text-cyan" />
            <span className="pill-val">{meshData.stats.relayed} Messages Delivered</span>
          </div>

          <div className={`telemetry-pill ${meshData.isWsConnected ? 'hotspot-active' : ''}`}>
            {meshData.isWsConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="pill-val">{meshData.isWsConnected ? 'Wi-Fi Hotspot Connected' : 'Offline Mode (No Internet)'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="nav-action-buttons">
          <button className="btn-nav-sos" onClick={() => setIsSosOpen(true)}>
            <AlertTriangle size={15} />
            <span>🚨 SOS ALERT</span>
          </button>

          <button className="btn-nav-action cam-glow-btn" onClick={() => setIsCameraOpen(true)} title="Take photos & videos that save safely to nearby phones">
            <Camera size={15} className="text-emerald" />
            <span className="hide-on-mobile">📸 Save Proof</span>
          </button>

          <button className="btn-nav-action live-pulse-btn" onClick={() => setIsLiveOpen(true)} title="Go live on YouTube without mobile internet">
            <Video size={15} className="text-red" />
            <span className="hide-on-mobile">🔴 Live Stream</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsInstallOpen(true)} title="Install app onto phone">
            <Smartphone size={15} className="text-emerald" />
            <span className="hide-on-mobile">📲 Get App (APK)</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsShareOpen(true)} title="Show QR code for friends to join instantly">
            <Share2 size={15} />
            <span className="hide-on-mobile">🤝 Share App (QR)</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsNostrOpen(true)} title="Sync with global internet backup servers">
            <Globe size={15} className="text-purple" />
            <span className="hide-on-mobile">🌐 Web Backup</span>
          </button>

          <button className="btn-nav-action" onClick={() => setIsTopologyOpen(true)} title="See how messages hop phone-to-phone">
            <Network size={15} />
            <span className="hide-on-mobile">🗺️ How It Works</span>
          </button>

          <button className="btn-nav-action stealth-btn" onClick={() => setInDecoyMode(true)} title="Switch to normal working calculator screen">
            <EyeOff size={15} />
            <span className="hide-on-mobile">🤫 Hide (Calc)</span>
          </button>

          <button className="btn-nav-danger" onClick={handlePanicWipe} title="Clear all messages and history">
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {wipeAlert && (
        <div className="zeroize-banner">
          <Shield size={16} />
          <span>ALL MESSAGES & DATA CLEARED SAFELY</span>
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
              <span>💬 Messages</span>
            </button>
            <button 
              className={`view-tab ${activeTab === 'radar' ? 'active' : ''}`}
              onClick={() => setActiveTab('radar')}
            >
              <Radio size={15} />
              <span>📡 People Nearby ({meshData.peers.length})</span>
            </button>
            <button 
              className={`view-tab ${activeTab === 'acoustic' ? 'active' : ''}`}
              onClick={() => setActiveTab('acoustic')}
            >
              <Volume2 size={15} />
              <span>🔊 Sound Messages</span>
            </button>
          </div>

          <div className="anti-censor-badge">
            <Shield size={12} />
            <span>✅ 100% OFFLINE • NO SIM OR INTERNET NEEDED</span>
          </div>
        </div>

        {/* View 1: Mesh Feed */}
        {activeTab === 'feed' && (
          <div className="feed-layout">
            {/* Left Channel Sidebar */}
            <aside className="channel-sidebar">
              <div className="sidebar-section-title">CHANNELS</div>
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

              {/* Network Quick Stats */}
              <div className="swarm-stats-card">
                <div className="stats-header">CONNECTION SUMMARY</div>
                <div className="stats-row">
                  <span>Messages Shared:</span>
                  <strong>{meshData.stats.relayed}</strong>
                </div>
                <div className="stats-row">
                  <span>Duplicates Filtered:</span>
                  <strong>{meshData.stats.droppedDuplicates}</strong>
                </div>
                <div className="stats-row">
                  <span>Crowd Reach:</span>
                  <strong>Up to 5 phones away</strong>
                </div>
                <div className="stats-row">
                  <span>Connection:</span>
                  <strong className="text-emerald">Bluetooth & Wi-Fi</strong>
                </div>
              </div>

              {/* Quick Hide Notice */}
              <div className="field-guide-card">
                <div className="guide-title">Quick Hide Shortcut:</div>
                <p>Tap the shield logo or press <code>Escape</code> twice if someone checks your phone to instantly show a normal calculator.</p>
              </div>
            </aside>

            {/* Center Messages Column */}
            <main className="messages-container">
              <div className="channel-header-bar">
                <div className="ch-title-wrap">
                  <span className="active-ch-name">{CHANNELS.find(c => c.id === selectedChannel)?.label || selectedChannel}</span>
                  <span className="active-ch-sub">{getChannelSubtitle(selectedChannel)}</span>
                </div>
                <div className="crypto-badge">
                  <Lock size={12} />
                  <span>🔒 Private & Encrypted</span>
                </div>
              </div>

              {/* Messages Scroll Feed */}
              <div className="messages-stream">
                {filteredMessages.length === 0 ? (
                  <div className="empty-messages-placeholder">
                    <Radio size={32} className="pulse-empty" />
                    <div className="empty-title">No messages in this channel yet</div>
                    <div className="empty-sub">Type a message below to send it to everyone nearby</div>
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
                            <span className={`author-badge ${isMine ? 'mine' : ''}`}>
                              {msg.author} {isMine ? '(You)' : ''}
                            </span>
                            {msg.tags && msg.tags.map((t, i) => (
                              <span key={i} className="msg-tag">{formatTag(t)}</span>
                            ))}
                          </div>
                          <div className="msg-meta">
                            <span className="msg-hops">{formatHops(msg.hops)}</span>
                            <span className="msg-transport">via {formatTransport(msg.transport)}</span>
                            <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {renderMessageContent(msg)}

                        {isSos && (
                          <div className="sos-priority-footer">
                            <AlertTriangle size={13} />
                            <span>🚨 URGENT EMERGENCY ALERT • Sent immediately to all nearby phones</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <div className="input-priority-bar">
                  <span className="priority-label">Alert Type:</span>
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
                    Important
                  </button>
                  <button 
                    type="button" 
                    className={`priority-btn priority-sos ${inputPriority === 'CRITICAL_SOS' ? 'active' : ''}`}
                    onClick={() => setInputPriority('CRITICAL_SOS')}
                  >
                    🚨 Urgent SOS
                  </button>
                </div>

                <div className="input-row">
                  <input 
                    type="text" 
                    className="mesh-text-input"
                    placeholder={`Type a message to everyone nearby...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button type="submit" className="btn-send-mesh" disabled={!inputText.trim()}>
                    <Send size={15} />
                    <span>Send</span>
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
