// arcade-clash/src/webrtc/signaling.ts
import { SimpleEventEmitter } from './event_emitter';

// Helper to convert snake_case to camelCase
function toCamelCase(s: string): string {
    return s.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
}

interface SignalingMessage {
  type: string;
  playerId?: string;
  targetId?: string;
  senderId?: string;
  sdp?: RTCSessionDescriptionInit;
  iceCandidate?: RTCIceCandidateInit;
  [key: string]: any;
}

export class SignalingClient extends SimpleEventEmitter {
  private ws: WebSocket | null = null;
  private playerId: string | null = null;
  private signalingServerUrl: string;

  constructor(signalingServerUrl: string) {
    super();
    this.signalingServerUrl = signalingServerUrl;
  }

  public connect(playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        console.warn("Signaling: Already connected or connecting.");
        return resolve();
      }
      this.playerId = playerId;
      this.ws = new WebSocket(this.signalingServerUrl);

      this.ws.onopen = () => {
        console.log(`Signaling: Connected to ${this.signalingServerUrl}`);
        this.sendRegistration();
        // The 'registered' event from the server will complete the connection process
      };

      this.ws.onmessage = (event) => {
        const message: SignalingMessage = JSON.parse(event.data);
        const eventType = toCamelCase(message.type);
        console.log(`Signaling: Received message type '${message.type}', emitting '${eventType}'`, message);
        this.emit(eventType, message);

        if (eventType === 'registered') {
            resolve();
        }
      };

      this.ws.onclose = () => {
        console.log('Signaling: Disconnected');
        this.ws = null;
        this.emit('disconnected');
      };

      this.ws.onerror = (error) => {
        console.error('Signaling: WebSocket error', error);
        this.ws = null;
        this.emit('error', error);
        reject(error);
      };
    });
  }

  private sendRegistration() {
    if (this.ws && this.playerId) {
      this.send({ type: 'register', playerId: this.playerId });
    }
  }

  public send(message: SignalingMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Signaling: WebSocket not open. Message not sent:', message);
    }
  }

  // --- Lobby and Matchmaking Methods ---

  public joinLobby(playerName: string) {
    this.send({ type: 'join_lobby', playerName });
  }

  public requestMatch(targetId: string) {
    this.send({ type: 'request_match', targetId });
  }

  public acceptMatch(sessionId: string) {
    this.send({ type: 'accept_match', sessionId });
  }

  public declineMatch(sessionId: string) {
    this.send({ type: 'decline_match', sessionId });
  }

  // --- WebRTC Signaling Methods ---

  public sendSdpOffer(targetId: string, sdp: RTCSessionDescriptionInit) {
    this.send({ type: 'sdp_offer', targetId, sdp });
  }

  public sendSdpAnswer(targetId: string, sdp: RTCSessionDescriptionInit) {
    this.send({ type: 'sdp_answer', targetId, sdp });
  }

  public sendIceCandidate(targetId: string, iceCandidate: RTCIceCandidateInit) {
    this.send({ type: 'ice_candidate', targetId, iceCandidate });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}