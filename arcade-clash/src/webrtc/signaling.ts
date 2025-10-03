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
    console.log('Signaling: Attempting to connect...', playerId); // Added for debugging
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
      };

      this.ws.onmessage = (event) => {
        const message: SignalingMessage = JSON.parse(event.data);
        let eventType = message.type;
        if (message.type !== 'peerId') {
            eventType = toCamelCase(message.type);
        }
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

  private send(message: SignalingMessage) {
    console.log('Signaling: Sending message', message); // Added for debugging
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Signaling: WebSocket not open. Message not sent:', message);
    }
  }
  
  private sendRegistration() {
    if (this.ws && this.playerId) {
      this.send({ type: 'register', playerId: this.playerId });
    }
  }

  // --- Lobby and Matchmaking Methods ---
  public joinLobby(playerName: string) { this.send({ type: 'join_lobby', playerName }); }
  public requestMatch(targetId: string) { this.send({ type: 'request_match', targetId }); }
  public acceptMatch(sessionId: string) { this.send({ type: 'accept_match', sessionId }); }
  public declineMatch(sessionId: string) { this.send({ type: 'decline_match', sessionId }); }

  // --- Generic WebRTC Signaling Method for PeerJS ---
  public sendPeerId(targetId: string, peerId: string) {
    this.send({ type: 'send_peer_id', targetId, peerId });
  }

  public sendPeerJSSignal(targetId: string, signalData: any) {
    this.send({ type: 'peerjs_signal', targetId, signal: signalData });
  }

  public disconnect() {
    console.log('Signaling: Disconnect method called.'); // Added for debugging
    if (this.ws) {
      this.ws.close();
    }
  }
}
