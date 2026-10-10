import React, { useState } from 'react';
import { AlertTriangle, Flame, ShieldAlert, Droplets, Users, MapPin, X, Bell, Zap } from 'lucide-react';
import { acousticModem } from '../services/ultrasonicModem';

export default function SosModal({ isOpen, onClose, onDispatchSos }) {
  const [selectedType, setSelectedType] = useState('MEDICAL');
  const [locationNote, setLocationNote] = useState('');
  const [isStrobeActive, setIsStrobeActive] = useState(false);
  const [playAudioAlarm, setPlayAudioAlarm] = useState(true);

  if (!isOpen) return null;

  const SOS_PRESETS = [
    {
      id: 'MEDICAL',
      label: 'Medical Emergency',
      icon: AlertTriangle,
      color: '#ef4444',
      defaultMsg: 'URGENT: Medic needed! Person injured / tear gas asphyxiation.',
      tag: 'MEDICAL'
    },
    {
      id: 'STAMPEDE',
      label: 'Crowd Crush / Stampede',
      icon: Flame,
      color: '#f97316',
      defaultMsg: 'DANGER: Stampede / crowd crush hazard! Move towards open flank.',
      tag: 'STAMPEDE'
    },
    {
      id: 'BARRICADE',
      label: 'Detention / Barricade',
      icon: ShieldAlert,
      color: '#8b5cf6',
      defaultMsg: 'ALERT: Mass detentions and road blocked by police barricades.',
      tag: 'POLICE'
    },
    {
      id: 'SUPPLIES',
      label: 'Water & First Aid Station',
      icon: Droplets,
      color: '#06b6d4',
      defaultMsg: 'RELIEF: Fresh water, salt, and first aid supplies available here.',
      tag: 'SUPPLIES'
    },
    {
      id: 'MISSING',
      label: 'Missing Person / Contact Lost',
      icon: Users,
      color: '#eab308',
      defaultMsg: 'ALERT: Lost contact with companion. Last seen near central circle.',
      tag: 'MISSING'
    }
  ];

  const currentPreset = SOS_PRESETS.find(p => p.id === selectedType) || SOS_PRESETS[0];

  const handleBroadcast = () => {
    const fullText = locationNote.trim() 
      ? `[${currentPreset.tag}] ${currentPreset.defaultMsg} Location: ${locationNote.trim()}`
      : `[${currentPreset.tag}] ${currentPreset.defaultMsg}`;

    if (playAudioAlarm) {
      acousticModem.playSosSiren();
    }

    onDispatchSos(fullText, currentPreset.tag);
    onClose();
  };

  return (
    <div className={`sos-modal-overlay ${isStrobeActive ? 'strobe-flashing' : ''}`}>
      <div className="sos-modal-content">
        <div className="sos-modal-header">
          <div className="sos-header-left">
            <span className="sos-blinking-pill">
              <span className="sos-pulse-circle"></span>
              EMERGENCY SOS ALERT
            </span>
            <div className="sos-subtitle">Instantly alerts everyone with phones nearby</div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="sos-preset-grid">
          {SOS_PRESETS.map(preset => {
            const Icon = preset.icon;
            const isSelected = selectedType === preset.id;
            return (
              <button
                key={preset.id}
                className={`sos-preset-card ${isSelected ? 'selected' : ''}`}
                style={{ borderColor: isSelected ? preset.color : 'rgba(255,255,255,0.08)' }}
                onClick={() => setSelectedType(preset.id)}
              >
                <div className="preset-icon-wrap" style={{ background: `${preset.color}22`, color: preset.color }}>
                  <Icon size={18} />
                </div>
                <div className="preset-label">{preset.label}</div>
              </button>
            );
          })}
        </div>

        <div className="sos-input-group">
          <label className="sos-input-label">
            <MapPin size={14} />
            <span>Where are you? (Optional Landmark)</span>
          </label>
          <input 
            type="text" 
            className="sos-text-field"
            placeholder="e.g. Near Gate 3, Metro Pillar 12, Janpath crossing..."
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
          />
        </div>

        <div className="sos-toggles-row">
          <label className="sos-toggle-label">
            <input 
              type="checkbox" 
              checked={playAudioAlarm} 
              onChange={(e) => setPlayAudioAlarm(e.target.checked)} 
            />
            <Bell size={14} />
            <span>Play Loud Alarm Sound</span>
          </label>

          <button 
            type="button" 
            className={`btn-strobe-toggle ${isStrobeActive ? 'active' : ''}`}
            onClick={() => setIsStrobeActive(!isStrobeActive)}
          >
            <Zap size={14} />
            <span>{isStrobeActive ? 'Stop Flashing Screen' : 'Flash Red Screen Light'}</span>
          </button>
        </div>

        <div className="sos-action-bar">
          <button className="btn-sos-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-sos-transmit" onClick={handleBroadcast}>
            <AlertTriangle size={18} />
            <span>SEND EMERGENCY ALERT NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
}
