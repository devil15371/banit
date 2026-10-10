import React, { useState, useEffect } from 'react';
import { X, Smartphone, Apple, Check, Download, Share, PlusSquare, ShieldCheck, Terminal } from 'lucide-react';

export default function InstallAppModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState('ios'); // 'ios' | 'android'

  useEffect(() => {
    // Capture PWA install prompt for Android/Chrome
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Auto-detect OS
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      setActivePlatformTab('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      setActivePlatformTab('ios');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install on Android: Tap Chrome's menu (3 dots) in the top-right corner, then tap 'Install app' or 'Add to Home Screen'.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="install-modal-content">
        <div className="install-header">
          <div className="install-title-box">
            <Smartphone size={22} className="icon-emerald" />
            <div>
              <div className="modal-title">INSTALL APP ON YOUR PHONE</div>
              <div className="modal-subtitle">Works directly on iPhone & Android without needing internet or app store sign-in</div>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="platform-tabs-row">
          <button 
            className={`platform-tab ${activePlatformTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('ios')}
          >
            <Apple size={16} />
            <span>iPhone & iPad</span>
          </button>
          <button 
            className={`platform-tab ${activePlatformTab === 'android' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('android')}
          >
            <Smartphone size={16} />
            <span>Android Phone</span>
          </button>
        </div>

        {/* iOS Section */}
        {activePlatformTab === 'ios' && (
          <div className="platform-guide-body">
            <div className="platform-badge-row">
              <span className="badge-immune">
                <ShieldCheck size={13} />
                Direct Install • No App Store Account Needed
              </span>
            </div>

            <div className="install-steps-list">
              <div className="inst-step">
                <span className="step-num">1</span>
                <div>
                  <strong>Open in Safari:</strong>
                  <p>Open this webpage in Safari on your iPhone.</p>
                </div>
              </div>

              <div className="inst-step">
                <span className="step-num">2</span>
                <div>
                  <div className="step-icon-label">
                    <Share size={15} className="text-cyan" />
                    <strong>Tap the Share Button:</strong>
                  </div>
                  <p>Tap the square box with the arrow pointing up at the bottom of your screen.</p>
                </div>
              </div>

              <div className="inst-step">
                <span className="step-num">3</span>
                <div>
                  <div className="step-icon-label">
                    <PlusSquare size={15} className="text-emerald" />
                    <strong>Tap "Add to Home Screen":</strong>
                  </div>
                  <p>Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</p>
                </div>
              </div>
            </div>

            <div className="inst-result-card">
              <Check size={16} className="text-emerald" />
              <div>
                <strong>Ready to use:</strong> The app will appear on your phone home screen just like a regular app, and will work completely offline even if internet is cut!
              </div>
            </div>
          </div>
        )}

        {/* Android Section */}
        {activePlatformTab === 'android' && (
          <div className="platform-guide-body">
            <div className="platform-badge-row">
              <span className="badge-immune">
                <ShieldCheck size={13} />
                Direct Install • Works Completely Offline
              </span>
            </div>

            {/* Method A: One-Tap PWA */}
            <div className="android-method-box">
              <div className="method-title">Option 1: Add to Home Screen (Instant 1-Tap)</div>
              <p>Adds the app icon directly to your phone screen instantly.</p>
              <button className="btn-install-pwa" onClick={handleInstallClick}>
                <Download size={15} />
                <span>{isInstalled ? 'App Already Installed!' : 'Add to Home Screen'}</span>
              </button>
            </div>

            {/* Method B: Native APK */}
            <div className="android-method-box">
              <div className="method-title">Option 2: Download Android App (.apk File)</div>
              <p>Download the standalone install file. You can also share this file with friends over Bluetooth or flash drive!</p>
              <a href="./haven-mesh.apk" download="haven-mesh-crisis.apk" className="btn-install-pwa btn-apk-download-link">
                <Download size={15} />
                <span>Download Android App (.apk - 4.0 MB)</span>
              </a>
              <div className="apk-desc" style={{ marginTop: '8px' }}>Once downloaded, tap the file in your downloads to install.</div>
            </div>
          </div>
        )}

        <div className="install-footer">
          <p>Once installed, the app stays on your phone and works anytime even if cellular towers and internet are turned off.</p>
        </div>
      </div>
    </div>
  );
}
