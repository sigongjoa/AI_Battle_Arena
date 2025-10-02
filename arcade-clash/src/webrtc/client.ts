// arcade-clash/src/webrtc/client.ts
import { SignalingClient } from './signaling';
import { SimpleEventEmitter } from './event_emitter';

interface WebRtcClientOptions {
  signalingClient: SignalingClient;
  localPlayerId: string;
  remotePlayerId: string;
}

export type DataChannelName = 'game_input' | 'game_state_sync' | 'metadata';

export class WebRtcClient extends SimpleEventEmitter {
  private peerConnection: RTCPeerConnection;
  private dataChannels: Map<DataChannelName, RTCDataChannel> = new Map();
  private signalingClient: SignalingClient;
  private localPlayerId: string;
  private remotePlayerId: string;

  constructor(options: WebRtcClientOptions) {
    super();
    this.signalingClient = options.signalingClient;
    this.localPlayerId = options.localPlayerId;
    this.remotePlayerId = options.remotePlayerId;

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    this.setupPeerConnection();
    this.setupSignalingClientListeners();
  }

  private setupPeerConnection() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingClient.sendIceCandidate(this.remotePlayerId, event.candidate.toJSON());
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('WebRTC: Connection state changed:', this.peerConnection.connectionState);
      this.emit('connectionStateChange', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'connected') {
        this.emit('connected');
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      console.log(`WebRTC: Data channel '${channel.label}' created by remote peer`);
      this.setupDataChannel(channel.label as DataChannelName, channel);
    };
  }

  public createDataChannels() {
    this.setupDataChannel('game_input', this.peerConnection.createDataChannel('game_input', { ordered: false, maxRetransmits: 0 }));
    this.setupDataChannel('game_state_sync', this.peerConnection.createDataChannel('game_state_sync', { ordered: true }));
    this.setupDataChannel('metadata', this.peerConnection.createDataChannel('metadata', { ordered: true }));
  }

  private setupDataChannel(name: DataChannelName, channel: RTCDataChannel) {
    this.dataChannels.set(name, channel);

    channel.onopen = () => {
      console.log(`WebRTC: Data channel '${name}' opened`);
      this.emit('dataChannelOpen', name);
    };

    channel.onmessage = (event) => {
      this.emit('dataChannelMessage', { channel: name, data: event.data });
    };

    channel.onclose = () => {
      console.log(`WebRTC: Data channel '${name}' closed`);
      this.emit('dataChannelClose', name);
    };

    channel.onerror = (error) => {
      console.error(`WebRTC: Data channel '${name}' error`, error);
      this.emit('dataChannelError', { channel: name, error });
    };
  }

  private setupSignalingClientListeners() {
    this.signalingClient.on('sdpOfferReceived', async (message) => {
      if (message.senderId === this.remotePlayerId) {
        console.log('WebRTC: Received SDP offer', message.sdp);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.signalingClient.sendSdpAnswer(this.remotePlayerId, answer.toJSON());
      }
    });

    this.signalingClient.on('sdpAnswerReceived', async (message) => {
      if (message.senderId === this.remotePlayerId) {
        console.log('WebRTC: Received SDP answer', message.sdp);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
      }
    });

    this.signalingClient.on('iceCandidateReceived', async (message) => {
      if (message.senderId === this.remotePlayerId) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
        } catch (e) {
          console.error('WebRTC: Error adding received ICE candidate', e);
        }
      }
    });
  }

  public async startNegotiation() {
    try {
      this.createDataChannels();
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.signalingClient.sendSdpOffer(this.remotePlayerId, offer.toJSON());
      console.log('WebRTC: Sent SDP offer');
    } catch (e: any) {
      console.error('WebRTC: Error creating or sending offer', e.name, e.message, e);
    }
  }

  public sendData(channelName: DataChannelName, data: string | Blob | ArrayBuffer) {
    const channel = this.dataChannels.get(channelName);
    if (channel && channel.readyState === 'open') {
      channel.send(data);
    } else {
      console.warn(`WebRTC: Data channel '${channelName}' not open. Message not sent:`, data);
    }
  }

  public close() {
    this.dataChannels.forEach(channel => channel.close());
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.signalingClient.off('sdpOfferReceived');
    this.signalingClient.off('sdpAnswerReceived');
    this.signalingClient.off('iceCandidateReceived');
  }
}
