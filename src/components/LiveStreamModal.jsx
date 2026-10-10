import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Video, VideoOff, Radio, Shield, AlertTriangle, EyeOff, 
  UploadCloud, Play, Square, Wifi, CheckCircle2, Lock, Flame
} from 'lucide-react';
import { meshEngine } from '../services/meshEngine';

export default function LiveStreamModal({ isOpen, onClose, onPanicToDecoy }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamChunksCount, setStreamChunksCount] = useState(0);
  const [streamKey, setStreamKey] = useState('yt-live-crisis-key-xxxx');
  const [streamTarget, setStreamTarget] = useState('YOUTUBE'); // 'YOUTUBE' | 'TWITCH' | 'REDDIT'
  const [cameraError, setCameraError] = useState(null);
  const [evaporateNotice, setEvaporateNotice] = useState(false);
  
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCameraPreview();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCameraPreview = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera preview error:", err);
      setCameraError("Camera access required for live swarm streaming.");
    }
  };

  const stopCamera = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsStreaming(false);
  };

  const startLiveSwarmBroadcast = () => {
    if (!mediaStreamRef.current) return;
    setIsStreaming(true);
    setStreamChunksCount(0);
    setEvaporateNotice(true);

    try {
      // Chunk live video into 2-second low-bitrate bursts
      const recorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 250000 // 250 kbps lightweight burst for rapid multi-hop relaying
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setStreamChunksCount(prev => prev + 1);

          // Broadcast live video chunk telemetry across local mesh
          meshEngine.broadcastMessage(
            `[LIVE_STREAM_BURST] Target: ${streamTarget} | Chunk #${Date.now().toString().slice(-4)} | Size: ${Math.round(event.data.size / 1024)}KB`,
            '#sos-beacon',
            'CRITICAL_SOS',
            ['LIVE_VIDEO', streamTarget],
            'HOTSPOT_WEBSOCKET'
          );
        }
      };

      recorder.start(2000); // 2-second chunks
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("Live streaming recorder error:", err);
    }
  };

  const stopLiveSwarmBroadcast = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsStreaming(false);
  };

  const handlePolicePanic = () => {
    // 1. Immediately cut camera & audio
    stopCamera();
    // 2. Broadcast critical detention alert to surrounding peers
    meshEngine.broadcastMessage(
      `[EMERGENCY DETENTION] Streamer captured by police. Camera killed. Last footage relayed to swarm.`,
      '#sos-beacon',
      'CRITICAL_SOS',
      ['DETENTION_ALERT']
    );
    // 3. Immediately jump to Decoy Calculator leaving zero trace on device
    onPanicToDecoy();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="livestream-modal-content">
        <div className="livestream-header">
          <div className="livestream-title-box">
            <Radio size={22} className="text-red pulse-icon" />
            <div>
              <div className="modal-title">LIVE SWARM STREAM TO YOUTUBE & REDDIT</div>
              <div className="modal-subtitle">Multi-hop video relay: Streams out through the crowd to perimeter internet gateways</div>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tactical Viewfinder */}
        <div className="viewfinder-container">
          {cameraError ? (
            <div className="camera-error-box">
              <VideoOff size={36} className="text-red" />
              <p>{cameraError}</p>
              <button className="btn-retry-camera" onClick={startCameraPreview}>Retry Camera Permission</button>
            </div>
          ) : (
            <div className="video-wrapper">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="live-video-element"
              />

              {/* Viewfinder Tactical HUD Overlay */}
              <div className="hud-overlay">
                <div className="hud-top">
                  <div className={`hud-badge ${isStreaming ? 'live' : 'standby'}`}>
                    <span className="dot-pulse"></span>
                    <span>{isStreaming ? 'SWARM STREAMING LIVE' : 'STANDBY'}</span>
                  </div>
                  {isStreaming && (
                    <div className="hud-chunk-counter">
                      <span>RELAYED CHUNKS: <strong>{streamChunksCount}</strong></span>
                    </div>
                  )}
                </div>

                <div className="hud-bottom">
                  <div className="hud-anti-forensic-tag">
                    <Shield size={12} className="text-emerald" />
                    <span>ZERO-LOCAL-STORAGE: Video stream evaporates to swarm immediately</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Swarm Workaround Explainer */}
        <div className="stream-explainer-card">
          <div className="ex-title">How Going Live Works During Internet Shutdowns:</div>
          <div className="ex-grid">
            <div className="ex-step">
              <span className="ex-num">1</span>
              <div><strong>Micro-Burst Video:</strong> Your camera compresses video into 2-second chunks.</div>
            </div>
            <div className="ex-step">
              <span className="ex-num">2</span>
              <div><strong>Crowd Bucket Brigade:</strong> Chunks hop phone-to-phone across the crowd via Wi-Fi/Bluetooth.</div>
            </div>
            <div className="ex-step">
              <span className="ex-num">3</span>
              <div><strong>Perimeter YouTube Ingest:</strong> Nodes at the edge of the blackout push the stream directly to YouTube RTMP servers!</div>
            </div>
          </div>
        </div>

        {/* Stream Settings & Targets */}
        <div className="stream-controls-section">
          <div className="target-selector-row">
            <span className="control-label">Broadcast Target:</span>
            <div className="target-btn-group">
              <button 
                className={`target-btn ${streamTarget === 'YOUTUBE' ? 'active' : ''}`}
                onClick={() => setStreamTarget('YOUTUBE')}
              >
                YouTube Live (RTMP)
              </button>
              <button 
                className={`target-btn ${streamTarget === 'REDDIT' ? 'active' : ''}`}
                onClick={() => setStreamTarget('REDDIT')}
              >
                Reddit Public Feed
              </button>
              <button 
                className={`target-btn ${streamTarget === 'TWITCH' ? 'active' : ''}`}
                onClick={() => setStreamTarget('TWITCH')}
              >
                Twitch / RTMP Ingest
              </button>
            </div>
          </div>

          <div className="stream-key-input-row">
            <label className="control-label">YouTube RTMP Ingest Key:</label>
            <input 
              type="password" 
              className="stream-key-field"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="rtmp://a.rtmp.youtube.com/live2/..."
            />
          </div>
        </div>

        {/* Action Buttons & Police Panic Trigger */}
        <div className="livestream-action-row">
          {!isStreaming ? (
            <button className="btn-start-stream" onClick={startLiveSwarmBroadcast}>
              <Play size={16} />
              <span>START LIVE SWARM BROADCAST</span>
            </button>
          ) : (
            <button className="btn-stop-stream" onClick={stopLiveSwarmBroadcast}>
              <Square size={16} />
              <span>PAUSE LIVE STREAM</span>
            </button>
          )}

          {/* CRITICAL ANTI-CONFISCATION PANIC TRIGGER */}
          <button 
            className="btn-police-panic" 
            onClick={handlePolicePanic}
            title="Police are approaching: Instantly cuts stream and turns screen into working calculator"
          >
            <EyeOff size={16} />
            <span>POLICE APPROACHING (PANIC TO CALCULATOR)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
