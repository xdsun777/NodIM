export interface PeerInfo {
  peer_id: string;
  address: string;
}

export interface ChatMessage {
  peerId: string;
  content: string;
  type: 'broadcast' | 'private';
  time: string;
}