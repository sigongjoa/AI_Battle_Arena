// arcade-clash/src/webrtc/data_channels.ts

// Define message types for the RTCDataChannel
export interface DataChannelMessage {
  type: 'text';
  payload: string;
}

// Example of how to create a message
export const createTextMessage = (text: string): DataChannelMessage => ({
  type: 'text',
  payload: text,
});
