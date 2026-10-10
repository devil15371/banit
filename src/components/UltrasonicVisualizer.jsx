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
    'Acoustic Modem standby. FSK modulation ready.',
    'Solves 2.4 GHz RF Jamming by operating entirely on mechanical sound waves.'
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

    const logMsg = `[TX] Transmitting "${textInput}" via ${isAudible ? 'Audible FSK (1.9kHz)' : 'Ultrasonic (19.2kHz)'}...`;
    setStatusLog(prev => [logMsg, ...prev.slice(0, 5)]);

    const success = await acousticModem.transmit(textInput, (pct) => {
      setProgress(pct);
    });

    setIsTransmitting(false);
    if (success) {
      setStatusLog(prev => [`[SUCCESS] Acoustic packet transmitted successfully!`, ...prev.slice(0, 5)]);
      if (onAcousticPacketSent) {
        onAcousticPacketSent(textInput);
      }
    } else {
      setStatusLog(prev => [`[ERROR] Acoustic transmission failed.`, ...prev.slice(0, 5)]);
    }
  };

  const toggleMicListening = async () => {
    if (isListening) {
      acousticModem.stopListening();
      setIsListening(false);
      setStatusLog(prev => ['[RX] Acoustic listener stopped.', ...prev.slice(0, 5)]);
    } else {
      const ok = await acousticModem.startListening();
      if (ok) {
        setIsListening(true);
        setStatusLog(prev => ['[RX] Live microphone listener active. Monitoring FSK bands.', ...prev.slice(0, 5)]);
      } else {
        setStatusLog(prev => ['[WARN] Microphone access denied or unavailable in this browser.', ...prev.slice(0, 5)]);
      }
    }
  };

  const handleSiren = () => {
    acousticModem.playSosSiren();
    setStatusLog(prev => ['[ALARM] Morse SOS Siren (... --- ...) synthesized on speakers!', ...prev.slice(0, 5)]);
  };

  return (
    <div className="acoustic-modem-container">
      <div className="modem-header">
        <div className="modem-title-box">
          <Activity className="icon-pulse" size={18} />
          <span className="modem-title">ACOUSTIC / ULTRASONIC MODEM</span>
          <span className="anti-jam-badge">
            <ShieldCheck size={12} />
            ANTI-JAMMING FALLBACK
          </span>
        </div>

        <div className="mode-toggle-group">
          <button 
            className={`btn-mode-toggle ${isAudible ? 'active' : ''}`}
            onClick={() => setIsAudible(true)}
            title="Audible frequencies allow you to hear the data chirps"
          >
            <Volume2 size={14} />
            <span>Audible Demo (1.9 kHz)</span>
          </button>
          <button 
            className={`btn-mode-toggle ${!isAudible ? 'active' : ''}`}
            onClick={() => setIsAudible(false)}
            title="Inaudible ultrasonic tones (18-20 kHz)"
          >
            <VolumeX size={14} />
            <span>Ultrasonic Inaudible (19.2 kHz)</span>
          </button>
        </div>
      </div>

      <div className="modem-explainer">
        <strong>Why this defeats RF Jammers:</strong> Police signal jammers blast the 2.4 GHz radio spectrum to disable Bluetooth and Wi-Fi. This modem converts packets into physical sound waves transmitted through phone speakers and decoded by neighboring phone microphones, bypassing radio jamming entirely.
      </div>

      {/* Real-time FFT Audio Spectrum */}
      <div className="spectrum-box">
        <div className="spectrum-label-row">
          <span>REAL-TIME ACOUSTIC SPECTRUM (FFT)</span>
          <span className={isListening ? 'listening-tag' : 'idle-tag'}>
            {isListening ? 'MIC LISTENING LIVE' : 'SPECTRUM IDLE'}
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
            placeholder="Enter emergency packet text to transmit over sound..."
            disabled={isTransmitting}
          />
          <button 
            className="btn-tx"
            onClick={handleTransmit}
            disabled={isTransmitting}
          >
            <Send size={15} />
            <span>{isTransmitting ? `Transmitting (${progress}%)` : 'Chirp Over Sound'}</span>
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
            <span>{isListening ? 'Stop Mic Listener' : 'Start Mic Listener'}</span>
          </button>

          <button className="btn-aux btn-siren" onClick={handleSiren}>
            <AlertOctagon size={15} />
            <span>Broadcast Audio Morse SOS</span>
          </button>
        </div>
      </div>

      {/* Modem Activity Log */}
      <div className="modem-log-box">
        <div className="log-title">Modem Telemetry</div>
        <div className="log-list">
          {statusLog.map((log, idx) => (
            <div key={idx} className="log-line">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
