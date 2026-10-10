# 🛡️ HAVEN MESH — Zero-Infrastructure Crisis Network

> **Autonomous Peer-to-Peer Delay-Tolerant Network (DTN) designed for Internet Blackouts, Protests, and Emergency Communication.**  
> Completely eliminates reliance on cell towers, central telecom infrastructure, Apple App Store, and Google Play Store.

---

## 🚀 Key Innovations Over BitChat & Briar

1. **📲 Zero-Install Local Hotspot Portal:**  
   Anyone nearby connects to an ad-hoc local Wi-Fi hotspot, opens their browser, and chats immediately with zero app downloads or account creation.
2. **🔊 Ultrasonic Acoustic Anti-Jamming Modem:**  
   Transmits packets as mechanical sound waves (speakers to microphones) to bypass police 2.4 GHz RF radio jammers.
3. **📸 3-Step Evidence Camera & Swarm Vault:**  
   Snaps photos and records video saved to an internal encrypted vault (hidden from standard device gallery). Automatically slices footage into 40 KB packets and mirrors them across 5+ nearby peer phones—so evidence survives even if police seize or destroy the recording phone.
4. **🔴 Live Swarm Streamer to YouTube & Reddit:**  
   Streams live video in 2-second micro-bursts hopping across the crowd human-chain until an edge node with 4G/Wi-Fi pushes the stream directly to YouTube Live.
5. **🧮 Anti-Forensic Stealth Decoy Calculator:**  
   Tap the logo or press `Esc` twice to turn the app into a working calculator. Entering `911=` triggers immediate cryptographic key zeroization. Entering `7378=` safely unlocks the tactical console.
6. **📡 BitChat Nostr Global Bridge:**  
   Connects to decentralized Nostr relays (`relay.damus.io`, `nos.lol`) when perimeter signal is reached, with privacy-preserving Geohash sectors (e.g. `#geo-ttnf2`).

---

## 📱 How to Install on Mobile

### 🍏 Apple iPhone & iPad (iOS)
Because Apple restricts crisis apps from the App Store, Haven Mesh is configured as an **Offline Progressive Web App (PWA)**:
1. Open the hosted GitHub Pages link in **Safari**.
2. Tap the **Share** button (box with upward arrow) at the bottom.
3. Scroll down and tap **"Add to Home Screen"** (`+`), then tap **Add**.
4. **Done!** The app runs full-screen, caches all data offline, and is immune to App Store bans.

### 🤖 Android (APK & 1-Tap Web App)
* **Direct APK Download:** Download [`haven-mesh.apk`](./public/haven-mesh.apk) (4.0 MB) directly and tap to install.
* **1-Tap Browser Install:** Open the link in Chrome and tap *"Install App"* from the banner.

---

## 💻 Local Development & Relay Daemon

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev -- --host

# 3. Run local Wi-Fi Hotspot WebSocket Bridge (Connects multiple phones on LAN)
npm run relay
```

---

## 📦 Building Native Android APK

```bash
# Build web bundle and sync Capacitor
npm run build
npx cap sync android

# Compile APK directly
cd android && ./gradlew assembleDebug
# Generated APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ⚖️ License
Released under the MIT License for public safety, free expression, and humanitarian crisis communication.
