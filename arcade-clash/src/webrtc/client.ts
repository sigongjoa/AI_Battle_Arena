// arcade-clash/src/webrtc/client.ts
import { SignalingClient } from './signaling';
import { SimpleEventEmitter } from './event_emitter';

interface WebRtcClientOptions {
  signalingClient: SignalingClient;
  localPlayerId: string;
  remotePlayerId: string;
  initiator: boolean;
}

export class WebRtcClient extends SimpleEventEmitter {
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingClient: SignalingClient;
  private localPlayerId: string;
  private remotePlayerId: string;
  private initiator: boolean;

  constructor(options: WebRtcClientOptions) {
    super();
    this.signalingClient = options.signalingClient;
    this.localPlayerId = options.localPlayerId;
    this.remotePlayerId = options.remotePlayerId;
    this.initiator = options.initiator;

    this.setupSignalingListeners();
    console.log('WebRTC: WebRtcClient instance created', this.remotePlayerId);
  }

  public async start(): Promise<void> {
    console.log('WebRTC: Starting WebRtcClient connection process.');
    await this.signalingClient.connect(this.localPlayerId);
    this.initializePeerConnection();

    if (this.initiator) {
      this.createOffer();
    }
  }

  private initializePeerConnection() {
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('WebRTC: Sending ICE candidate:', event.candidate);
        this.signalingClient.sendSignalingMessage({
          type: 'candidate',
          src: this.localPlayerId,
          dst: this.remotePlayerId,
          payload: event.candidate,
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('WebRTC: Connection state changed:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        this.emit('connected');
      } else if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
        this.emit('closed');
        this.destroy();
      }
    };

    this.pc.ondatachannel = (event) => {
      console.log('WebRTC: Data channel received:', event.channel.label);
      this.dataChannel = event.channel;
      this.setupDataChannelListeners(this.dataChannel);
    };

    if (this.initiator) {
      this.dataChannel = this.pc.createDataChannel('game_data');
      this.setupDataChannelListeners(this.dataChannel);
    }
  }

  private setupDataChannelListeners(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('WebRTC: DataChannel opened!');
      this.emit('datachannel_open');
    };

    channel.onmessage = (event) => {
      this.emit('data', event.data);
    };

    channel.onclose = () => {
      console.log('WebRTC: DataChannel closed.');
      this.emit('closed');
      this.destroy();
    };

    channel.onerror = (error) => {
      console.error('WebRTC: DataChannel error:', error);
      this.emit('error', error);
    };
  }

  private async createOffer() {
    if (!this.pc) return;
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      console.log('WebRTC: Sending offer:', offer);
      this.signalingClient.sendSignalingMessage({
        type: 'offer',
        src: this.localPlayerId,
        dst: this.remotePlayerId,
        payload: offer,
      });
    } catch (error) {
      console.error('WebRTC: Error creating offer:', error);
      this.emit('error', error);
    }
  }

  private async createAnswer() {
    if (!this.pc) return;
    try {
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      console.log('WebRTC: Sending answer:', answer);
      this.signalingClient.sendSignalingMessage({
        type: 'answer',
        src: this.localPlayerId,
        dst: this.remotePlayerId,
        payload: answer,
      });
    } catch (error) {
      console.error('WebRTC: Error creating answer:', error);
      this.emit('error', error);
    }
  }

  private setupSignalingListeners() {
    this.signalingClient.on('message', async (message: any) => {
      if (message.dst !== this.localPlayerId) {
        return; // Not for us
      }

      if (!this.pc) {
        this.initializePeerConnection(); // Initialize PC if not already
      }

      switch (message.type) {
        case 'offer':
          console.log('WebRTC: Received offer:', message.payload);
          await this.pc?.setRemoteDescription(new RTCSessionDescription(message.payload));
          this.createAnswer();
          break;
        case 'answer':
          console.log('WebRTC: Received answer:', message.payload);
          await this.pc?.setRemoteDescription(new RTCSessionDescription(message.payload));
          break;
        case 'candidate':
          console.log('WebRTC: Received ICE candidate:', message.payload);
          await this.pc?.addIceCandidate(new RTCIceCandidate(message.payload));
          break;
        default:
          console.warn('WebRTC: Unknown signaling message type:', message.type);
      }
    });
  }

  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
    } else {
      console.warn('WebRTC: DataChannel not open. Cannot send data.');
    }
  }

  public destroy() {
    console.log('WebRTC: WebRtcClient instance destroyed', this.remotePlayerId);
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.signalingClient.disconnect();
    this.signalingClient.off('message'); // Remove signaling message listener
  }
}