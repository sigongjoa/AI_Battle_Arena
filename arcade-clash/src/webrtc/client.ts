// arcade-clash/src/webrtc/client.ts
import { Peer, DataConnection } from 'peerjs';
import { SignalingClient } from './signaling';
import { SimpleEventEmitter } from './event_emitter';

interface WebRtcClientOptions {
  signalingClient: SignalingClient;
  localPlayerId: string; // Added for WebRtcClient to know its own signaling ID
  remotePlayerId: string;
  initiator: boolean; // Are we starting the connection?
}

export class WebRtcClient extends SimpleEventEmitter {
  private peer: Peer;
  private signalingClient: SignalingClient;
  private remotePlayerId: string;
  private localPlayerId: string; // Stored local player ID
  private conn: DataConnection | null = null; // PeerJS DataConnection
  private initiator: boolean;

  constructor(options: WebRtcClientOptions) {
    super();
    this.signalingClient = options.signalingClient;
    this.remotePlayerId = options.remotePlayerId;
    this.localPlayerId = options.localPlayerId;
    this.initiator = options.initiator;

    // PeerJS Peer constructor. We'll use a a generated ID for now, and configure signaling later.
    this.peer = new Peer(undefined, {
      host: 'localhost',
      port: 9000, // Default PeerServer port
      path: '/myapp',
      secure: false, // Explicitly set to false for local HTTP PeerServer
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    this.setupPeerListeners();

    this.signalingClient.on('peerId', (message: { senderId: string, peerId: string }) => {
      if (message.senderId === this.remotePlayerId) {
        console.log('WebRTC: Received remote PeerJS ID from signaling server:', message.peerId);
        this.handleRemotePeerId(message.peerId);
      }
    }); // Commented out for PeerJS initial setup
    console.log('WebRTC: WebRtcClient instance created', this.remotePlayerId, this.peer); // Added for debugging
  }

  public async start(): Promise<void> {
    console.log('WebRTC: Starting WebRtcClient connection process.');
    await this.signalingClient.connect(this.localPlayerId);
    this.setupSignalingListeners(); // Ensure signaling listeners are set up after connection
  }

  private setupPeerListeners() {
    this.peer.on('open', (id) => {
      console.log('WebRTC: PeerJS Peer opened with ID:', id);
      this.emit('peerIdReady', id); // Emit local PeerJS ID
      this.signalingClient.sendPeerId(this.remotePlayerId, id);

      // The initiator will wait for the remote PeerJS ID to be received via signaling before connecting.
      // this.connectToRemotePeer(this.remotePlayerId); // Removed: Initiator connects after receiving remote PeerJS ID
    });

    this.peer.on('connection', (conn) => {
      console.log('WebRTC: PeerJS received a data connection from:', conn.peer);
      this.conn = conn;
      this.setupDataConnectionListeners(this.conn);
    });

    this.peer.on('disconnected', () => {
      console.log('WebRTC: PeerJS Peer disconnected from PeerServer.');
      this.emit('closed');
      this.destroy();
    });

    this.peer.on('error', (err) => {
      console.error('WebRTC: PeerJS Peer error caught. Error details:', err);
      this.emit('error', err);
    });
  }

  public handleRemotePeerId(remotePeerId: string) {
    console.log('WebRTC: handleRemotePeerId called with:', remotePeerId);
    // If we are the initiator, we should connect to the remote peer now that we have their PeerJS ID
    if (this.initiator) {
      this.connectToRemotePeer(remotePeerId);
    }
  }

  private connectToRemotePeer(remotePeerId: string) {
    console.log('WebRTC: PeerJS attempting to connect to remote peer:', remotePeerId);
    const conn = this.peer.connect(remotePeerId, {
      reliable: true, // Ensure reliable data transfer for game state
    });
    this.conn = conn;
    this.setupDataConnectionListeners(this.conn);
  }

  private setupDataConnectionListeners(conn: DataConnection) {
    conn.on('open', () => {
      console.log('WebRTC: PeerJS DataConnection established!');
      this.emit('connected');
    });

    conn.on('data', (data: any) => {
      // TODO: Implement msgpack-lite decoding here
      this.emit('data', data);
    });

    conn.on('close', () => {
      console.log('WebRTC: PeerJS DataConnection closed.');
      this.emit('closed');
      this.destroy();
    });

    conn.on('error', (err) => {
      console.error('WebRTC: PeerJS DataConnection error caught. Error details:', err);
      this.emit('error', err);
    });
  }

  private setupSignalingListeners() {
    this.signalingClient.on('peerId', (message: { senderId: string, peerId: string }) => {
      if (message.senderId === this.remotePlayerId) {
        console.log('WebRTC: Received remote PeerJS ID:', message.peerId);
        // If we are not the initiator, we should connect to the remote peer
        if (!this.initiator) {
          this.connectToRemotePeer(message.peerId);
        }
      }
    });
  }
  
  public send(data: string | Buffer | ArrayBuffer | Blob) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    } else {
      console.warn('WebRTC: DataConnection not open. Cannot send data.');
    }
  }

  public destroy() {
    console.log('WebRTC: WebRtcClient instance destroyed', this.remotePlayerId); // Added for debugging
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
    }
    this.signalingClient.off('peerId'); // Remove listener for peerId messages
    this.signalingClient.disconnect();
  }
}
