import React, { useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameEngine } from '@/src/shared_game_logic/engine';
import { BackendMessage, FrontendMessage } from '@/types';

interface RLAgentControllerProps {
  backendPeerId: string;
  gameEngine: React.RefObject<GameEngine | null>;
}

const RLAgentController: React.FC<RLAgentControllerProps> = ({ backendPeerId, gameEngine }) => {
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('RLAgentController: My peer ID is:', id);
      if (backendPeerId) {
        console.log(`RLAgentController: Attempting to connect to backend peer: ${backendPeerId}`);
        const conn = peer.connect(backendPeerId);
        connRef.current = conn;
        setupConnectionListeners(conn);
      }
    });

    peer.on('error', (err) => {
      console.error('RLAgentController: PeerJS error:', err);
    });

    return () => {
      console.log('RLAgentController: Cleaning up PeerJS connection.');
      connRef.current?.close();
      peerRef.current?.destroy();
    };
  }, [backendPeerId]);

  const setupConnectionListeners = (conn: DataConnection) => {
    conn.on('open', () => {
      console.log(`RLAgentController: Data connection opened with ${conn.peer}`);
      const readyMsg: FrontendMessage = { type: 'connection_ready' };
      conn.send(readyMsg);
    });

    conn.on('data', (data) => {
      const message = data as BackendMessage;
      const engine = gameEngine.current;
      if (!engine) return;

      if (message.type === 'action') {
        engine.applyExternalAction(message.action);
        const observation = engine.getObservationForAgent();
        const reward = 0; // TODO: Implement reward calculation
        const done = false; // TODO: Implement done condition check

        const response: FrontendMessage = {
          type: 'step_result',
          observation,
          reward,
          done,
        };
        conn.send(response);

      } else if (message.type === 'reset') {
        engine.resetForRL();
        const observation = engine.getObservationForAgent();

        const response: FrontendMessage = {
          type: 'reset_result',
          observation,
        };
        conn.send(response);
      }
    });

    conn.on('close', () => {
      console.log(`RLAgentController: Data connection closed with ${conn.peer}`);
    });
  };

  return null;
};

export default RLAgentController;
