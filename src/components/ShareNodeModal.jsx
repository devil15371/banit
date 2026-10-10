import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Wifi, QrCode, Download, Copy, Check, Share2, Smartphone } from 'lucide-react';

export default function ShareNodeModal({ isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const localUrl = typeof window !== 'undefined' ? window.location.origin : 'http://haven.mesh';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(localUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error("QR Code generation error:", err));
    }
  }, [isOpen, localUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(localUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOfflineBundle = () => {
    // Generate a simple lightweight offline relay package
    const blob = new Blob([
      `<!DOCTYPE html><html><head><title>HAVEN MESH EMERGENCY RELAY</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0b0f19;color:#fff;font-family:sans-serif;padding:20px;text-align:center;"><h2>HAVEN MESH RELAY BEACON</h2><p>Connect to local hotspot and browse to ${localUrl}</p></body></html>`
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'haven-mesh-offline-relay.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay">
      <div className="share-modal-content">
        <div className="share-header">
          <div className="share-title-box">
            <Wifi size={20} className="icon-cyan" />
            <div>
              <div className="modal-title">ZERO-INSTALL LOCAL BEAM PORTAL</div>
              <div className="modal-subtitle">Allows nearby people to join the mesh immediately without app stores</div>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="share-body">
          {/* QR Code Presentation */}
          <div className="qr-card">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Join Mesh QR Code" className="qr-image" />
            ) : (
              <div className="qr-placeholder">Generating QR...</div>
            )}
            <div className="qr-caption">Scan with any phone camera to join</div>
          </div>

          {/* Quick Connection Details */}
          <div className="share-details">
            <div className="step-guide">
              <div className="step-item">
                <span className="step-badge">1</span>
                <div>
                  <strong>Turn On Local Wi-Fi Hotspot:</strong>
                  <div className="step-desc">Name it <code>HAVEN-MESH-EMERGENCY</code> (No password needed).</div>
                </div>
              </div>

              <div className="step-item">
                <span className="step-badge">2</span>
                <div>
                  <strong>Crowd Connects & Scans:</strong>
                  <div className="step-desc">Peers join your Wi-Fi and open their phone browser.</div>
                </div>
              </div>

              <div className="step-item">
                <span className="step-badge">3</span>
                <div>
                  <strong>Zero-Installation Chatting:</strong>
                  <div className="step-desc">No Apple App Store or Google Play account required! Works 100% offline.</div>
                </div>
              </div>
            </div>

            <div className="url-copy-box">
              <span className="url-label">Local Hotspot Address:</span>
              <div className="url-input-wrap">
                <input type="text" readOnly value={localUrl} className="url-input" />
                <button className="btn-copy" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <button className="btn-download-bundle" onClick={handleDownloadOfflineBundle}>
              <Download size={15} />
              <span>Export Offline Relay HTML File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
