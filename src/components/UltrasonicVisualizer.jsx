import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Radio, AlertOctagon, Send, Activity, ShieldCheck } from 'lucide-react';
import { acousticModem } from '../services/ultrasonicModem';

export default function UltrasonicVisualizer({ onAcousticPacketSent }) {
  const [isAudible, setIsAudible] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textInput, setTextInput] = useState('SOS: PATEL CHOWK SAFE');
  const [statusLog, setStatusLog] = useState([
    'Sound messenger ready.',
    'Works even when Wi-Fi and Bluetooth are blocked.'
  ]);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    acousticModem.setAudibleMode(isAudible);
  }, [isAudible]);

  useEffect(() => {
    // Connect spectrum analyzer callback
    acousticModem.onSpectrumData = (dataArray) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / 64);
      let x = 0;

      for (let i = 0; i < 64; i++) {
        const val = dataArray[i * 4];
        const percent = val / 255;
        const barHeight = percent * height;

        // Gradient based on intensity
        const hue = 160 + percent * 40; // Emerald to Cyan
        ctx.fillStyle = `hsl(${hue}, 90%, ${40 + percent * 30}%)`;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    return () => {
      acousticModem.onSpectrumData = null;
    };
  }, []);

  const handleTransmit = async () => {
    if (!textInput.trim() || isTransmitting) return;
    setIsTransmitting(true);
    setProgress(0);

    const logMsg = `Sending "${textInput}" as ${isAudible ? 'audible beeps' : 'silent high-pitch sound'}...`;
    setStatusLog(prev => [logMsg, ...prev.slice(0, 5)]);

    const success = await acousticModem.transmit(textInput, (pct) => {
      setProgress(pct);
    });

    setIsTransmitting(false);
    if (success) {
      setStatusLog(prev => [`✅ Sound message sent successfully!`, ...prev.slice(0, 5)]);
      if (onAcousticPacketSent) {
        onAcousticPacketSent(textInput);
      }
    } else {
      setStatusLog(prev => [`❌ Couldn't send — try again.`, ...prev.slice(0, 5)]);
    }
  };

  const toggleMicListening = async () => {
    if (isListening) {
      acousticModem.stopListening();
      setIsListening(false);
      setStatusLog(prev => ['Stopped listening.', ...prev.slice(0, 5)]);
    } else {
      const ok = await acousticModem.startListening();
      if (ok) {
        setIsListening(true);
        setStatusLog(prev => ['🎤 Listening for nearby sound messages...', ...prev.slice(0, 5)]);
      } else {
        setStatusLog(prev => ['⚠️ Microphone access denied. Please allow microphone permission.', ...prev.slice(0, 5)]);
      }
    }
  };

  const handleSiren = () => {
    acousticModem.playSosSiren();
    setStatusLog(prev => ['🔊 SOS alarm playing!', ...prev.slice(0, 5)]);
  };

  return (
    <div className="acoustic-modem-container">
      <div className="modem-header">
        <div className="modem-title-box">
          <Activity className="icon-pulse" size={18} />
          <span className="modem-title">SOUND MESSENGER</span>
          <span className="anti-jam-badge">
            <ShieldCheck size={12} />
            WORKS EVEN IF JAMMED
          </span>
        </div>

        <div className="mode-toggle-group">
          <button 
            className={`btn-mode-toggle ${isAudible ? 'active' : ''}`}
            onClick={() => setIsAudible(true)}
            title="Audible frequencies allow you to hear the data chirps"
          >
            <Volume2 size={14} />
            <span>Beeps You Can Hear</span>
          </button>
          <button 
            className={`btn-mode-toggle ${!isAudible ? 'active' : ''}`}
            onClick={() => setIsAudible(false)}
            title="Inaudible ultrasonic tones (18-20 kHz)"
          >
            <VolumeX size={14} />
            <span>Silent Ultrasonic (High Pitch)</span>
          </button>
        </div>
      </div>

      <div className="modem-explainer">
        <strong>Send Messages Using Sound Waves:</strong> If Wi-Fi or Bluetooth are jammed, this feature turns your message into sound chirps from your phone's speaker. Nearby phones listen with their microphone and read the message instantly.
      </div>

      {/* Real-time Audio Spectrum */}
      <div className="spectrum-box">
        <div className="spectrum-label-row">
          <span>LIVE SOUND WAVE VISUALIZER</span>
          <span className={isListening ? 'listening-tag' : 'idle-tag'}>
            {isListening ? 'LISTENING VIA MICROPHONE' : 'STANDBY'}
          </span>
        </div>
        <canvas ref={canvasRef} width={500} height={70} className="spectrum-canvas"></canvas>
      </div>

      {/* Transmission Controls */}
      <div className="modem-controls-card">
        <div className="tx-input-row">
          <input 
            type="text" 
            className="tx-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a short emergency message to send via sound..."
            disabled={isTransmitting}
          />
          <button 
            className="btn-tx"
            onClick={handleTransmit}
            disabled={isTransmitting}
          >
            <Send size={15} />
            <span>{isTransmitting ? `Sending (${progress}%)` : '🔊 Send via Sound'}</span>
          </button>
        </div>

        {isTransmitting && (
          <div className="tx-progress-bar-bg">
            <div className="tx-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        <div className="action-buttons-row">
          <button 
            className={`btn-aux ${isListening ? 'listening' : ''}`}
            onClick={toggleMicListening}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            <span>{isListening ? 'Stop Mic Listener' : 'Listen with Microphone'}</span>
          </button>

          <button className="btn-aux btn-siren" onClick={handleSiren}>
            <AlertOctagon size={15} />
            <span>🔊 Play Loud SOS Siren</span>
          </button>
        </div>
      </div>

      {/* Modem Activity Log */}
      <div className="modem-log-box">
        <div className="log-title">Recent Sound Activity</div>
        <div className="log-list">
          {statusLog.map((log, idx) => (
            <div key={idx} className="log-line">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
