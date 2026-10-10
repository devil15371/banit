/**
 * Standalone Local Hotspot Mesh Relay Node (Node.js)
 * Bridges all connected local Wi-Fi / Hotspot peers in real time without the internet.
 */

import { WebSocketServer } from 'ws';
import os from 'os';

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

// Get local IPv4 address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const connectedClients = new Set();
const peerDirectory = new Map();

console.log('====================================================');
console.log('   HAVEN MESH // LOCAL HOTSPOT RELAY SERVER ACTIVE');
console.log('====================================================');
console.log(`[*] Relay WebSocket Server listening on: ws://${localIp}:${PORT}`);
console.log(`[*] Peers on your Wi-Fi Hotspot can access the mesh console at:`);
console.log(`    --> http://${localIp}:5173`);
console.log('====================================================\n');

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  console.log(`[+] New peer connected. Total active mesh links: ${connectedClients.size}`);

  // Send current peer list
  ws.send(JSON.stringify({
    type: 'PEER_LIST',
    peers: Array.from(peerDirectory.values())
  }));

  ws.on('message', (messageRaw) => {
    try {
      const packet = JSON.parse(messageRaw.toString());

      if (packet.type === 'PEER_ANNOUNCE' && packet.peer) {
        peerDirectory.set(packet.peer.id, {
          ...packet.peer,
          transport: 'Hotspot Web',
          lastSeen: Date.now()
        });
        broadcast({
          type: 'PEER_LIST',
          peers: Array.from(peerDirectory.values())
        }, ws);
      } else if (packet.type === 'MESH_PACKET') {
        console.log(`[PACKET RELAY] [${packet.data.priority}] ${packet.data.author} -> ${packet.data.channel}: "${packet.data.text.slice(0, 40)}..."`);
        // Broadcast packet to all other connected mesh peers
        broadcast(packet, ws);
      }
    } catch (err) {
      console.warn('[!] Failed to parse mesh packet:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`[-] Peer disconnected. Total active mesh links: ${connectedClients.size}`);
  });
});

function broadcast(dataObj, senderWs) {
  const payload = JSON.stringify(dataObj);
  for (const client of connectedClients) {
    if (client !== senderWs && client.readyState === 1) { // 1 = OPEN
      client.send(payload);
    }
  }
}
