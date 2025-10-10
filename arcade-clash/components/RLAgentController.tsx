import React, { useEffect, useRef } from 'react';
import { GameEngine } from '@/src/shared_game_logic/engine';
import { BackendMessage, FrontendMessage } from '@/types';

const SIGNALING_URL = 'ws://localhost:8001/ws/';

interface RLAgentControllerProps {
  backendPeerId: string;
  gameEngine: React.RefObject<GameEngine | null>;
}

const RLAgentController: React.FC<RLAgentControllerProps> = ({ backendPeerId, gameEngine }) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    const frontendPeerId = `frontend_${Math.random().toString(36).substr(2, 9)}`;
    const ws = new WebSocket(`${SIGNALING_URL}${frontendPeerId}`);
    wsRef.current = ws;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    // -- WebSocket Signaling Logic --
    ws.onopen = () => {
      console.log('RLAgentController: Connected to custom signaling server.');
      // Once connected, create data channel and send offer
      setupPeerConnection();
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('RLAgentController: Received signaling message:', message);

      if (message.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        console.log('RLAgentController: Remote description (answer) set.');
      }
    };

    ws.onerror = (error) => {
      console.error('RLAgentController: WebSocket error:', error);
    };

    const setupPeerConnection = async () => {
      // Create Data Channel - must be done before creating offer
      const dc = pc.createDataChannel('game-data');
      dcRef.current = dc;
      setupDataChannelListeners(dc);

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send Offer to backend via signaling server
      const offerMessage = {
        type: 'offer',
        dst: backendPeerId,
        payload: { type: offer.type, sdp: offer.sdp },
      };
      ws.send(JSON.stringify(offerMessage));
      console.log('RLAgentController: Sent offer to backend.');
    };

    return () => {
      console.log('RLAgentController: Cleaning up connections.');
      dcRef.current?.close();
      pcRef.current?.close();
      wsRef.current?.close();
    };
  }, [backendPeerId]);

  const setupDataChannelListeners = (dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log(`RLAgentController: Data channel is open!`);
      console.log("RLAgentController: Sending 'connection_ready'.");
      const readyMsg: FrontendMessage = { type: 'connection_ready' };
      dc.send(JSON.stringify(readyMsg));
    };

    dc.onmessage = (event) => {
      try {
        console.log(`RLAgentController: Received message:`, event.data);
        const message = JSON.parse(event.data) as BackendMessage;
        const engine = gameEngine.current;

        if (!engine) {
          console.error("RLAgentController: GameEngine is not available.");
          return;
        }

        if (message.type === 'action') {
          // Apply actions for both players
          engine.applyExternalAction(engine.getGameState().player1.id, message.p1Action);
          engine.applyExternalAction(engine.getGameState().player2.id, message.p2Action);
          engine.update(); // Update the game state after applying actions

          const currentGameState = engine.getGameState();
          const statePayload = {
            observation: engine.getObservationForAgent(),
            p1_health: currentGameState.player1.health.toNumber(),
            p2_health: currentGameState.player2.health.toNumber(),
            p1_pos_x: currentGameState.player1.position.x.toNumber(),
            p2_pos_x: currentGameState.player2.position.x.toNumber(),
            round_over: currentGameState.roundOver,
          };

          const response: FrontendMessage = {
            type: 'action_result',
            state: statePayload,
          };
          dc.send(JSON.stringify(response));

        } else if (message.type === 'reset') {
          console.log("RLAgentController: Processing 'reset' message.");
          engine.resetForRL();
          const currentGameState = engine.getGameState();

          const statePayload = {
            observation: engine.getObservationForAgent(),
            p1_health: currentGameState.player1.health.toNumber(),
            p2_health: currentGameState.player2.health.toNumber(),
            p1_pos_x: currentGameState.player1.position.x.toNumber(),
            p2_pos_x: currentGameState.player2.position.x.toNumber(),
            round_over: currentGameState.roundOver,
          };

          const response: FrontendMessage = {
            type: 'reset_result',
            state: statePayload,
          };
          dc.send(JSON.stringify(response));
          console.log("RLAgentController: Sent 'reset_result'.");
        }
      } catch (error) {
        console.error("RLAgentController: Error in onmessage handler:", error);
      }
    };

    dc.onclose = () => {
      console.log(`RLAgentController: Data channel closed.`);
    };
  };

  return null; // This is a headless component
};

export default RLAgentController;