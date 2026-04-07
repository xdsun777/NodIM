import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export class P2PClient {
  private static instance: P2PClient;
  public localPeerId = '';

  private constructor() {}
  static getInstance(): P2PClient {
    if (!this.instance) this.instance = new P2PClient();
    return this.instance;
  }

  async init() {
    this.localPeerId = await invoke<string>('get_local_peer_id');
    return this.localPeerId;
  }

  async getPeers() {
    return invoke<any[]>('get_peers');
  }

  async sendBroadcast(msg: string) {
    return invoke('send_broadcast', { msg });
  }

  async sendPrivate(peerId: string, msg: string) {
    return invoke('send_private', { peerId, msg });
  }

  onPeerDiscovered(callback: () => void) {
    return listen('peer:discovered', callback);
  }

  onBroadcastMessage(callback: (peerId: string, content: string) => void) {
    return listen<[string, string]>('message:broadcast', (e) => callback(e.payload[0], e.payload[1]));
  }

  onPrivateMessage(callback: (peerId: string, content: string) => void) {
    return listen<[string, string]>('message:private', (e) => callback(e.payload[0], e.payload[1]));
  }
}

export const p2p = P2PClient.getInstance();