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
              <div className="modal-title">INSTALL ON MOBILE (ANDROID & APPLE iOS)</div>
              <div className="modal-subtitle">Bypass App Store & Google Play censorship with direct offline installation</div>
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
            <span>Apple iPhone & iPad</span>
          </button>
          <button 
            className={`platform-tab ${activePlatformTab === 'android' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('android')}
          >
            <Smartphone size={16} />
            <span>Android (APK & PWA)</span>
          </button>
        </div>

        {/* iOS Section */}
        {activePlatformTab === 'ios' && (
          <div className="platform-guide-body">
            <div className="platform-badge-row">
              <span className="badge-immune">
                <ShieldCheck size={13} />
                Immune to Apple App Store Bans & Takedowns
              </span>
            </div>

            <div className="install-steps-list">
              <div className="inst-step">
                <span className="step-num">1</span>
                <div>
                  <strong>Open in Safari:</strong>
                  <p>Visit this page in Safari on your iPhone.</p>
                </div>
              </div>

              <div className="inst-step">
                <span className="step-num">2</span>
                <div>
                  <div className="step-icon-label">
                    <Share size={15} className="text-cyan" />
                    <strong>Tap the Share Button:</strong>
                  </div>
                  <p>Tap the box with the upward arrow at the bottom of Safari.</p>
                </div>
              </div>

              <div className="inst-step">
                <span className="step-num">3</span>
                <div>
                  <div className="step-icon-label">
                    <PlusSquare size={15} className="text-emerald" />
                    <strong>Select "Add to Home Screen":</strong>
                  </div>
                  <p>Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</p>
                </div>
              </div>
            </div>

            <div className="inst-result-card">
              <Check size={16} className="text-emerald" />
              <div>
                <strong>Result on iPhone:</strong> Appears as a standalone full-screen native app on your home screen with its own tactical icon, working completely offline without internet!
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
                No Google Play Account or Approval Needed
              </span>
            </div>

            {/* Method A: One-Tap PWA */}
            <div className="android-method-box">
              <div className="method-title">Method 1: Direct 1-Tap Browser Install (Recommended)</div>
              <p>Installs directly onto your phone screen without downloading any 100MB files.</p>
              <button className="btn-install-pwa" onClick={handleInstallClick}>
                <Download size={15} />
                <span>{isInstalled ? 'App Already Installed!' : 'Install Haven Mesh to Android Phone'}</span>
              </button>
            </div>

            {/* Method B: Native APK */}
            <div className="android-method-box">
              <div className="method-title">Method 2: Standalone Native Android APK (Offline Sideload)</div>
              <p>Direct standalone installable <code>.apk</code> compiled directly on your machine. Share it over Bluetooth or USB!</p>
              <a href="/haven-mesh.apk" download="haven-mesh-crisis.apk" className="btn-install-pwa btn-apk-download-link">
                <Download size={15} />
                <span>Download Standalone haven-mesh.apk (4.0 MB)</span>
              </a>
              <div className="apk-desc" style={{ marginTop: '8px' }}>Native project ready in <code>android/</code> directory with Bluetooth, Audio, and Hotspot hardware permissions.</div>
            </div>
          </div>
        )}

        <div className="install-footer">
          <p>Both methods ensure you have an independent, censorship-resistant tool on your mobile device ready before any crisis occurs.</p>
        </div>
      </div>
    </div>
  );
}
