/**
 * Ultrasonic / Acoustic FSK Modem
 * Transmits and receives data packets over sound waves using the Web Audio API.
 * Solves 2.4 GHz RF Jamming when Wi-Fi and Bluetooth are blocked by authorities.
 */

class AcousticModem {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.mediaStream = null;
    this.isListening = false;
    this.isTransmitting = false;

    // Default to ultrasonic frequencies (18.2 kHz - 19.8 kHz)
    // Or audible mode for easy acoustic demonstration (1800 Hz - 2400 Hz)
    this.audibleMode = true; // Default to audible demo so users can hear & test without lab mics
    this.onPacketReceived = null;
    this.onSpectrumData = null;

    this.charDelayMs = 45; // Baud rate: ~22 baud for robust room acoustic transmission
  }

  getFrequencies() {
    if (this.audibleMode) {
      return {
        mark: 1900,   // Binary '1' frequency
        space: 1400,  // Binary '0' frequency
        preamble: 2400, // Packet Start preamble
        postamble: 900  // Packet End postamble
      };
    } else {
      // True Ultrasonic / Inaudible to adult humans
      return {
        mark: 19200,
        space: 18400,
        preamble: 20200,
        postamble: 17600
      };
    }
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setAudibleMode(enableAudible) {
    this.audibleMode = enableAudible;
  }

  /**
   * Transmits a string payload as FSK acoustic chirps
   */
  async transmit(payloadString, onProgress) {
    this.initAudio();
    if (this.isTransmitting) return false;
    this.isTransmitting = true;

    const freqs = this.getFrequencies();
    const ctx = this.audioCtx;

    // Convert string to binary stream
    let binaryStream = '';
    for (let i = 0; i < payloadString.length; i++) {
      const charCode = payloadString.charCodeAt(i);
      binaryStream += charCode.toString(2).padStart(8, '0');
    }

    try {
      // Create master gain
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.connect(gainNode);
      osc.start();

      let playTime = ctx.currentTime + 0.05;

      // Preamble Chirp (Tells receivers a packet is incoming)
      gainNode.gain.setValueAtTime(0.3, playTime);
      osc.frequency.setValueAtTime(freqs.preamble, playTime);
      playTime += 0.12;

      // Bit transmission
      const bitDuration = this.charDelayMs / 1000;
      const totalBits = binaryStream.length;

      for (let i = 0; i < totalBits; i++) {
        const bit = binaryStream[i];
        const targetFreq = bit === '1' ? freqs.mark : freqs.space;
        
        osc.frequency.setValueAtTime(targetFreq, playTime);
        playTime += bitDuration;

        if (onProgress && i % 8 === 0) {
          const progressPercent = Math.round((i / totalBits) * 100);
          setTimeout(() => onProgress(progressPercent), (playTime - ctx.currentTime) * 1000);
        }
      }

      // Postamble Chirp
      osc.frequency.setValueAtTime(freqs.postamble, playTime);
      playTime += 0.1;

      // Fade out
      gainNode.gain.setValueAtTime(0.3, playTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.05);

      const totalDurationMs = (playTime + 0.1 - ctx.currentTime) * 1000;
      await new Promise(resolve => setTimeout(resolve, totalDurationMs));

      osc.stop();
      osc.disconnect();
      this.isTransmitting = false;
      if (onProgress) onProgress(100);
      return true;
    } catch (err) {
      console.error("Acoustic transmission error:", err);
      this.isTransmitting = false;
      return false;
    }
  }

  /**
   * Starts listening through microphone for acoustic/ultrasonic chirps
   */
  async startListening() {
    this.initAudio();
    if (this.isListening) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.analyser);

      this.isListening = true;
      this._listenLoop();
      return true;
    } catch (err) {
      console.warn("Microphone access denied or unavailable for acoustic modem:", err);
      this.isListening = false;
      return false;
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  _listenLoop() {
    if (!this.isListening || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    if (this.onSpectrumData) {
      this.onSpectrumData(dataArray, this.audioCtx.sampleRate);
    }

    // Demodulation state machine can be bound here
    requestAnimationFrame(() => this._listenLoop());
  }

  /**
   * Synthesize a loud emergency Morse code SOS siren
   */
  playSosSiren() {
    this.initAudio();
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    // Morse code SOS: ... --- ... (dots: 0.1s, dashes: 0.25s)
    let t = now;
    
    // S: 3 short
    for (let i = 0; i < 3; i++) {
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.setValueAtTime(0, t + 0.1);
      t += 0.18;
    }
    t += 0.1;

    // O: 3 long
    for (let i = 0; i < 3; i++) {
      osc.frequency.setValueAtTime(660, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.setValueAtTime(0, t + 0.28);
      t += 0.36;
    }
    t += 0.1;

    // S: 3 short
    for (let i = 0; i < 3; i++) {
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.setValueAtTime(0, t + 0.1);
      t += 0.18;
    }

    osc.start(now);
    osc.stop(t + 0.2);
  }
}

export const acousticModem = new AcousticModem();
