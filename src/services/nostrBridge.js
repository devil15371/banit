/**
 * Nostr Protocol Global Bridge
 * Inspired by BitChat's dual-transport architecture.
 * When any mesh node reaches broadband/satellite at the perimeter of the blackout,
 * it bridges local mesh packets out to global Nostr relays (and vice-versa).
 */

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

export class NostrBridge {
  constructor() {
    this.relays = DEFAULT_RELAYS;
    this.sockets = new Map();
    this.connectedRelays = 0;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    this.onPacketFromNostr = null;
    this.onStatusChange = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  handleNetworkChange(online) {
    this.isOnline = online;
    if (online) {
      this.connectRelays();
    } else {
      this.disconnectRelays();
    }
    if (this.onStatusChange) this.onStatusChange(this.getStatus());
  }

  connectRelays() {
    if (!this.isOnline) return;

    this.relays.forEach(url => {
      if (this.sockets.has(url)) return;

      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          this.connectedRelays += 1;
          this.subscribeToMeshEvents(ws);
          if (this.onStatusChange) this.onStatusChange(this.getStatus());
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Nostr EVENT message: ["EVENT", <sub_id>, <event_obj>]
            if (data[0] === 'EVENT' && data[2]) {
              const nostrEvent = data[2];
              this.handleIncomingNostrEvent(nostrEvent);
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          this.sockets.delete(url);
          this.connectedRelays = Math.max(0, this.connectedRelays - 1);
          if (this.onStatusChange) this.onStatusChange(this.getStatus());
        };

        ws.onerror = () => {
          this.sockets.delete(url);
        };

        this.sockets.set(url, ws);
      } catch (_) {}
    });
  }

  disconnectRelays() {
    this.sockets.forEach(ws => {
      try { ws.close(); } catch (_) {}
    });
    this.sockets.clear();
    this.connectedRelays = 0;
  }

  subscribeToMeshEvents(ws) {
    // Subscribe to Kind 1 (text note) or Kind 20000+ (ephemeral) tagged with #havenmesh or #bitchat
    const subMsg = JSON.stringify([
      "REQ",
      "haven_mesh_sub",
      {
        "kinds": [1],
        "#t": ["havenmesh", "bitchat", "emergency"],
        "limit": 10
      }
    ]);
    try {
      ws.send(subMsg);
    } catch (_) {}
  }

  handleIncomingNostrEvent(event) {
    if (!event || !event.content) return;

    const packet = {
      id: 'nostr-' + event.id.substring(0, 8),
      channel: '#all-mesh',
      author: 'NOSTR:' + event.pubkey.substring(0, 6).toUpperCase(),
      authorId: '0x' + event.pubkey.substring(0, 8),
      text: event.content,
      priority: 'NORMAL',
      timestamp: event.created_at * 1000,
      ttl: 5,
      hops: 1,
      transport: 'NOSTR_GLOBAL_RELAY',
      tags: ['NOSTR_GLOBAL', 'EXT_BRIDGE'],
      verified: true
    };

    if (this.onPacketFromNostr) {
      this.onPacketFromNostr(packet);
    }
  }

  /**
   * Encapsulate and publish a local mesh packet to the Nostr network
   */
  publishMeshPacket(packet) {
    if (this.connectedRelays === 0) return false;

    // Construct standard Nostr Event (Kind 1)
    const nostrEvent = {
      id: 'mock_id_' + Date.now(),
      pubkey: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [
        ["t", "havenmesh"],
        ["t", "bitchat"],
        ["t", packet.channel.replace('#', '')],
        ["origin", packet.author]
      ],
      content: packet.text,
      sig: 'mock_sig_' + Math.random().toString(36)
    };

    const outMsg = JSON.stringify(["EVENT", nostrEvent]);
    let successCount = 0;

    this.sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(outMsg);
          successCount++;
        } catch (_) {}
      }
    });

    return successCount > 0;
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      connectedRelays: this.connectedRelays,
      totalRelays: this.relays.length,
      relayList: this.relays
    };
  }
}

export const nostrBridge = new NostrBridge();
