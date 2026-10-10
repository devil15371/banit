import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Video, VideoOff, Circle, Square, RotateCcw, 
  ShieldCheck, Share2, Download, Trash2, Eye, EyeOff, Play, 
  Sparkles, CheckCircle2, Clock, Users, HardDrive, RefreshCw
} from 'lucide-react';

import { evidenceVault } from '../services/evidenceVault';
import { meshEngine } from '../services/meshEngine';

export default function EvidenceCameraModal({ isOpen, onClose, onPanicToDecoy }) {
  const [activeTab, setActiveTab] = useState('capture'); // 'capture' | 'vault'
  const [captureMode, setCaptureMode] = useState('photo'); // 'photo' | 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState(null);
  const [dispersionStatus, setDispersionStatus] = useState(null); // { progress, mediaId, totalChunks }
  
  // Vault state
  const [vaultSubTab, setVaultSubTab] = useState('mine'); // 'mine' | 'swarm'
  const [myMedia, setMyMedia] = useState([]);
  const [swarmMedia, setSwarmMedia] = useState([]);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState(null);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadVaultItems();
      if (activeTab === 'capture') {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  useEffect(() => {
    const unsub = evidenceVault.subscribe(loadVaultItems);
    return () => unsub();
  }, []);

  const loadVaultItems = async () => {
    const mine = await evidenceVault.getMyEvidence();
    const swarm = await evidenceVault.getSwarmEvidence();
    setMyMedia(mine.reverse());
    setSwarmMedia(swarm.reverse());
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: captureMode === 'video'
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera init error:", err);
      setCameraError("Camera permission needed to capture crisis evidence.");
    }
  };

  const stopCamera = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // 1. Capture Photo
  const takePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add tactical cryptographic watermark
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(10, canvas.height - 35, canvas.width - 20, 25);
    ctx.fillStyle = "#10b981";
    ctx.font = "12px monospace";
    const timestampStr = new Date().toISOString();
    ctx.fillText(`HAVEN MESH EVIDENCE // NODE: ${meshEngine.identity.callsign} // ${timestampStr}`, 18, canvas.height - 18);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const mediaId = 'ev-photo-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    const evidenceItem = {
      id: mediaId,
      type: 'photo',
      title: `Photo Evidence #${mediaId.slice(-4)}`,
      dataUrl: dataUrl,
      timestamp: Date.now(),
      author: meshEngine.identity.callsign,
      authorId: meshEngine.identity.id,
      isMirrored: false,
      sizeBytes: Math.round(dataUrl.length * 0.75)
    };

    // Step 1 & 2: Save to local device vault
    await evidenceVault.saveLocalEvidence(evidenceItem);
    await loadVaultItems();

    // Step 3: Chunk and disperse across swarm
    disperseMediaToSwarm(evidenceItem);
  };

  // 2. Start Video Recording
  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    setRecordingSeconds(0);
    setIsRecording(true);

    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 350000
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(timerIntervalRef.current);
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result;
          const mediaId = 'ev-vid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

          const evidenceItem = {
            id: mediaId,
            type: 'video',
            title: `Video Evidence (${recordingSeconds}s) #${mediaId.slice(-4)}`,
            dataUrl: dataUrl,
            timestamp: Date.now(),
            durationSeconds: recordingSeconds,
            author: meshEngine.identity.callsign,
            authorId: meshEngine.identity.id,
            isMirrored: false,
            sizeBytes: blob.size
          };

          // Step 1 & 2: Save to local device memory
          await evidenceVault.saveLocalEvidence(evidenceItem);
          await loadVaultItems();

          // Step 3: Chunk and disperse to swarm
          disperseMediaToSwarm(evidenceItem);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("Recording error:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Step 3: Chunk and disperse across surrounding peer apps
  const disperseMediaToSwarm = (evidenceItem) => {
    const chunks = evidenceVault.chunkMedia(evidenceItem.id, evidenceItem.dataUrl, {
      type: evidenceItem.type,
      title: evidenceItem.title,
      timestamp: evidenceItem.timestamp,
      author: evidenceItem.author,
      authorId: evidenceItem.authorId
    });

    setDispersionStatus({
      mediaId: evidenceItem.id,
      totalChunks: chunks.length,
      currentChunk: 0,
      peersCount: meshEngine.peers.length
    });

    // Broadcast chunks across mesh
    chunks.forEach((chunk, index) => {
      setTimeout(() => {
        meshEngine.broadcastMessage(
          `[SWARM_EVIDENCE_BURST] ${evidenceItem.title} Chunk ${index + 1}/${chunks.length}`,
          '#all-mesh',
          'HIGH',
          ['EVIDENCE_SWARM'],
          'HOTSPOT_WEBSOCKET'
        );

        // Also ingest locally into swarm buffer so other nodes and simulation reflect it
        evidenceVault.ingestSwarmChunk(chunk);

        setDispersionStatus(prev => prev ? { ...prev, currentChunk: index + 1 } : null);

        if (index === chunks.length - 1) {
          setTimeout(() => {
            setDispersionStatus(null);
          }, 3000);
        }
      }, (index + 1) * 350);
    });
  };

  const handlePolicePanic = () => {
    stopCamera();
    meshEngine.wipeAllData(); // Zeroes messages and destroys media
    onPanicToDecoy(); // Flips to calculator
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="camera-modal-content">
        {/* Top Header */}
        <div className="camera-header-row">
          <div className="cam-title-box">
            <Camera size={20} className="icon-emerald" />
            <div>
              <div className="modal-title">EVIDENCE RECORDER & SWARM VAULT</div>
              <div className="modal-subtitle">Auto-mirrored across peer phones: Evidence survives device confiscation</div>
            </div>
          </div>

          <div className="cam-header-actions">
            <div className="tab-switch-pill">
              <button 
                className={`cam-tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
                onClick={() => { setActiveTab('capture'); startCamera(); }}
              >
                Capture
              </button>
              <button 
                className={`cam-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
                onClick={() => { setActiveTab('vault'); stopCamera(); loadVaultItems(); }}
              >
                Swarm Vault ({myMedia.length + swarmMedia.length})
              </button>
            </div>
            <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* View 1: Camera Viewfinder */}
        {activeTab === 'capture' && (
          <div className="cam-capture-body">
            <div className="viewfinder-frame">
              {cameraError ? (
                <div className="camera-error-box">
                  <VideoOff size={40} className="text-red" />
                  <p>{cameraError}</p>
                  <button className="btn-retry-camera" onClick={startCamera}>Enable Camera</button>
                </div>
              ) : (
                <div className="viewfinder-inner">
                  <video ref={videoRef} autoPlay playsInline muted className="viewfinder-video" />

                  {/* Tactical Crosshair Overlay */}
                  <div className="viewfinder-hud">
                    <div className="hud-corner top-left"></div>
                    <div className="hud-corner top-right"></div>
                    <div className="hud-corner bottom-left"></div>
                    <div className="hud-corner bottom-right"></div>

                    {isRecording && (
                      <div className="rec-active-badge">
                        <span className="rec-dot-pulse"></span>
                        <span>REC: {recordingSeconds}s</span>
                      </div>
                    )}

                    <div className="hud-bottom-telemetry">
                      <span>FPS: 30</span>
                      <span>RES: 720p</span>
                      <span>WATERMARK: ON-DEVICE</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dispersion Banner */}
            {dispersionStatus && (
              <div className="dispersion-progress-banner">
                <div className="dispersion-text">
                  <Share2 size={14} className="icon-pulse" />
                  <span>
                    DISPERSING EVIDENCE TO {dispersionStatus.peersCount} PEERS: Chunk {dispersionStatus.currentChunk}/{dispersionStatus.totalChunks}
                  </span>
                </div>
                <div className="dispersion-bar-bg">
                  <div 
                    className="dispersion-bar-fill" 
                    style={{ width: `${Math.round((dispersionStatus.currentChunk / dispersionStatus.totalChunks) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Camera Controls Bar */}
            <div className="cam-controls-row">
              <div className="mode-toggle-pill">
                <button 
                  className={`btn-mode-select ${captureMode === 'photo' ? 'active' : ''}`}
                  onClick={() => setCaptureMode('photo')}
                  disabled={isRecording}
                >
                  Photo
                </button>
                <button 
                  className={`btn-mode-select ${captureMode === 'video' ? 'active' : ''}`}
                  onClick={() => setCaptureMode('video')}
                  disabled={isRecording}
                >
                  Video
                </button>
              </div>

              {/* Shutter Button */}
              {captureMode === 'photo' ? (
                <button className="btn-shutter photo" onClick={takePhoto} title="Capture Photo Evidence">
                  <div className="shutter-inner photo"></div>
                </button>
              ) : (
                !isRecording ? (
                  <button className="btn-shutter video" onClick={startRecording} title="Start Video Recording">
                    <div className="shutter-inner video-rec"></div>
                  </button>
                ) : (
                  <button className="btn-shutter recording" onClick={stopRecording} title="Stop & Save Video">
                    <Square size={20} fill="#ef4444" />
                  </button>
                )
              )}

              <button className="btn-switch-camera" onClick={toggleFacingMode} title="Flip Front/Back Camera">
                <RotateCcw size={18} />
              </button>
            </div>

            {/* 3-Step Architecture Explainer & Panic Bar */}
            <div className="capture-footer-bar">
              <div className="three-step-pill">
                <span>1. Stored in App Memory</span>
                <span>•</span>
                <span>2. Mirrored to Swarm</span>
                <span>•</span>
                <span>3. Survives Confiscation</span>
              </div>

              <button className="btn-panic-quick" onClick={handlePolicePanic} title="Emergency: Police approaching">
                <EyeOff size={14} />
                <span>Police Approaching (Panic to Calculator)</span>
              </button>
            </div>
          </div>
        )}

        {/* View 2: Swarm Evidence Vault Gallery */}
        {activeTab === 'vault' && (
          <div className="vault-gallery-body">
            <div className="vault-subtabs-row">
              <button 
                className={`vault-subtab-btn ${vaultSubTab === 'mine' ? 'active' : ''}`}
                onClick={() => setVaultSubTab('mine')}
              >
                <HardDrive size={14} />
                <span>My Captured Evidence ({myMedia.length})</span>
              </button>
              <button 
                className={`vault-subtab-btn ${vaultSubTab === 'swarm' ? 'active' : ''}`}
                onClick={() => setVaultSubTab('swarm')}
              >
                <Users size={14} />
                <span>Mirrored Peer Evidence ({swarmMedia.length})</span>
              </button>
            </div>

            <div className="vault-items-grid">
              {(vaultSubTab === 'mine' ? myMedia : swarmMedia).length === 0 ? (
                <div className="empty-vault-card">
                  <ShieldCheck size={36} className="text-dim" />
                  <p>No {vaultSubTab === 'mine' ? 'captured' : 'mirrored'} evidence in vault yet.</p>
                  <span>Photos and videos recorded in the crowd will populate here automatically.</span>
                </div>
              ) : (
                (vaultSubTab === 'mine' ? myMedia : swarmMedia).map(item => (
                  <div key={item.id} className="evidence-card" onClick={() => setSelectedPreviewItem(item)}>
                    <div className="card-thumb-wrap">
                      {item.type === 'photo' ? (
                        <img src={item.dataUrl} alt={item.title} className="thumb-img" />
                      ) : (
                        <video src={item.dataUrl} className="thumb-video" />
                      )}
                      <span className="type-badge">{item.type.toUpperCase()}</span>
                      {item.isMirrored && <span className="mirrored-badge">SWARM BACKUP</span>}
                    </div>

                    <div className="card-info">
                      <div className="item-title">{item.title}</div>
                      <div className="item-meta">
                        <span>{item.author}</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Media Item Detail / Fullscreen Preview Modal */}
            {selectedPreviewItem && (
              <div className="preview-overlay" onClick={() => setSelectedPreviewItem(null)}>
                <div className="preview-content-card" onClick={(e) => e.stopPropagation()}>
                  <div className="preview-header">
                    <div>
                      <strong>{selectedPreviewItem.title}</strong>
                      <p>Captured by: {selectedPreviewItem.author} • {new Date(selectedPreviewItem.timestamp).toLocaleString()}</p>
                    </div>
                    <button className="btn-close-preview" onClick={() => setSelectedPreviewItem(null)}>×</button>
                  </div>

                  <div className="preview-media-container">
                    {selectedPreviewItem.type === 'photo' ? (
                      <img src={selectedPreviewItem.dataUrl} alt="Evidence" className="full-preview-img" />
                    ) : (
                      <video src={selectedPreviewItem.dataUrl} controls autoPlay className="full-preview-video" />
                    )}
                  </div>

                  <div className="preview-actions-bar">
                    <a 
                      href={selectedPreviewItem.dataUrl} 
                      download={`${selectedPreviewItem.id}.${selectedPreviewItem.type === 'photo' ? 'jpg' : 'webm'}`}
                      className="btn-download-evidence"
                    >
                      <Download size={15} />
                      <span>Export to File</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
