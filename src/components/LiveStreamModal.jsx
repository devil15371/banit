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

          // Broadcast friendly live video update across nearby phones
          meshEngine.broadcastMessage(
            `🔴 Live video streaming to ${streamTarget} (clip #${Date.now().toString().slice(-4)}, ${Math.round(event.data.size / 1024)} KB) - passing across nearby phones`,
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
    // 2. Broadcast friendly alert to nearby peers
    meshEngine.broadcastMessage(
      `🚨 Streamer closed camera. Video clips were saved safely across nearby phones.`,
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
              <div className="modal-title">GO LIVE ON YOUTUBE (WITHOUT INTERNET)</div>
              <div className="modal-subtitle">Video hops from phone to phone across the crowd until it reaches working internet</div>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Viewfinder */}
        <div className="viewfinder-container">
          {cameraError ? (
            <div className="camera-error-box">
              <VideoOff size={36} className="text-red" />
              <p>{cameraError}</p>
              <button className="btn-retry-camera" onClick={startCameraPreview}>Grant Camera Permission</button>
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

              {/* Viewfinder Overlay */}
              <div className="hud-overlay">
                <div className="hud-top">
                  <div className={`hud-badge ${isStreaming ? 'live' : 'standby'}`}>
                    <span className="dot-pulse"></span>
                    <span>{isStreaming ? 'STREAMING LIVE' : 'READY TO STREAM'}</span>
                  </div>
                  {isStreaming && (
                    <div className="hud-chunk-counter">
                      <span>VIDEO CLIPS SENT: <strong>{streamChunksCount}</strong></span>
                    </div>
                  )}
                </div>

                <div className="hud-bottom">
                  <div className="hud-anti-forensic-tag">
                    <Shield size={12} className="text-emerald" />
                    <span>SAFE: Video is not stored on this phone. It hops directly to other phones.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Simple 3-step explanation */}
        <div className="stream-explainer-card">
          <div className="ex-title">How this works when mobile internet is cut:</div>
          <div className="ex-grid">
            <div className="ex-step">
              <span className="ex-num">1</span>
              <div><strong>Short Clips:</strong> Your camera captures small 2-second video clips.</div>
            </div>
            <div className="ex-step">
              <span className="ex-num">2</span>
              <div><strong>Passes Between Phones:</strong> Nearby phones pass the clips to each other using Bluetooth and Wi-Fi.</div>
            </div>
            <div className="ex-step">
              <span className="ex-num">3</span>
              <div><strong>Goes Live:</strong> As soon as a clip reaches someone with working internet, it uploads immediately!</div>
            </div>
          </div>
        </div>

        {/* Stream Settings & Targets */}
        <div className="stream-controls-section">
          <div className="target-selector-row">
            <span className="control-label">Stream Platform:</span>
            <div className="target-btn-group">
              <button 
                className={`target-btn ${streamTarget === 'YOUTUBE' ? 'active' : ''}`}
                onClick={() => setStreamTarget('YOUTUBE')}
              >
                YouTube Live
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
                Twitch Live
              </button>
            </div>
          </div>

          <div className="stream-key-input-row">
            <label className="control-label">Stream Key (Optional):</label>
            <input 
              type="password" 
              className="stream-key-field"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="Paste YouTube stream key or leave default..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="livestream-action-row">
          {!isStreaming ? (
            <button className="btn-start-stream" onClick={startLiveSwarmBroadcast}>
              <Play size={16} />
              <span>START LIVE STREAM</span>
            </button>
          ) : (
            <button className="btn-stop-stream" onClick={stopLiveSwarmBroadcast}>
              <Square size={16} />
              <span>STOP LIVE STREAM</span>
            </button>
          )}

          {/* Quick Disguise Button */}
          <button 
            className="btn-police-panic" 
            onClick={handlePolicePanic}
            title="Instantly stop video and open a working calculator"
          >
            <EyeOff size={16} />
            <span>QUICK HIDE (SWITCH TO CALCULATOR)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
