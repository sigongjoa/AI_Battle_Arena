import React, { useEffect, useRef, useState } from 'react';
import { Character as CharacterType } from '../types';
import characterMetadata from '../src/components/characterMetadata.json';

interface GamePlayer {
  id: number;
  character: string;
  x: number;
  y: number;
  health: number;
  action: 'idle' | 'walk' | 'punch';
  frame: number;
}

interface GameArenaProps {
  gameState: {
    timer: number;
    players: GamePlayer[];
  };
  player1: CharacterType;
  player2: CharacterType;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const ARENA_FLOOR_Y = 450; // Characters should be drawn below this

interface SpriteSheetInfo {
  image: string;
  thumbnail: string;
  frameWidth: number;
  frameHeight: number;
  animations: {
    [key: string]: {
      row: number;
      frames: number;
    };
  };
}

const GameArena: React.FC<GameArenaProps> = ({ gameState, player1, player2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteImagesRef = useRef<{ [key: string]: HTMLImageElement }>({});

  // Load sprite images
  useEffect(() => {
    const charactersToLoad = new Set(gameState.players.map(p => p.character.toLowerCase()));

    charactersToLoad.forEach(characterName => {
      const metadata = characterMetadata[characterName as keyof typeof characterMetadata] as SpriteSheetInfo | undefined;
      if (!metadata) {
        console.warn(`[GameArena] No metadata for character: ${characterName}`);
        return;
      }

      // Only load if not already loaded
      if (!spriteImagesRef.current[characterName]) {
        const img = new Image();
        img.onload = () => {
          console.log(`[GameArena] ✅ Loaded sprite: ${characterName} (${img.width}x${img.height})`);
          spriteImagesRef.current[characterName] = img;
        };

        img.onerror = () => {
          console.error(`[GameArena] ❌ Failed to load sprite: ${characterName} from ${metadata.image}`);
        };

        img.src = metadata.image;
      }
    });
  }, []);

  // Game rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = () => {
      // Clear canvas with dark background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw arena background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, 'rgba(50, 50, 100, 0.3)');
      gradient.addColorStop(1, 'rgba(30, 30, 60, 0.5)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, ARENA_FLOOR_Y - 200, CANVAS_WIDTH, 200);

      // Draw floor line
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, ARENA_FLOOR_Y);
      ctx.lineTo(CANVAS_WIDTH, ARENA_FLOOR_Y);
      ctx.stroke();

      // Draw arena borders
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw players
      gameState.players.forEach((player, idx) => {
        const playerCharName = player.character.toLowerCase();
        const metadata = characterMetadata[playerCharName as keyof typeof characterMetadata] as SpriteSheetInfo | undefined;
        if (!metadata) {
          console.warn(`[GameArena] No metadata for player: ${player.character}`);
          return;
        }

        // Determine direction based on position
        const isPlayer1 = player.id === 1;
        const otherPlayer = gameState.players.find(p => p.id !== player.id);
        const facingRight = !isPlayer1 || (otherPlayer && player.x < otherPlayer.x);

        const spriteImage = spriteImagesRef.current[playerCharName];
        const drawX = player.x - metadata.frameWidth / 2;
        const drawY = ARENA_FLOOR_Y - metadata.frameHeight;

        if (idx === 0) {
          console.log(`[GameArena] Render: Player ${player.character} at (${drawX}, ${drawY}), spriteLoaded=${!!spriteImage}`);
        }

        // Draw sprite if loaded, otherwise draw placeholder
        if (spriteImage) {
          // Get animation frame
          const actionMeta = metadata.animations[player.action];
          if (!actionMeta) {
            console.warn(`[GameArena] No animation for ${player.action}`);
            return;
          }

          const frameIndex = player.frame % actionMeta.frames;
          const sourceX = frameIndex * metadata.frameWidth;
          const sourceY = actionMeta.row * metadata.frameHeight;

          ctx.save();
          if (!facingRight) {
            ctx.translate(player.x + metadata.frameWidth / 2, drawY);
            ctx.scale(-1, 1);
            ctx.translate(-(player.x + metadata.frameWidth / 2), -drawY);
          }

          ctx.drawImage(
            spriteImage,
            sourceX, sourceY,
            metadata.frameWidth, metadata.frameHeight,
            drawX, drawY,
            metadata.frameWidth, metadata.frameHeight
          );

          ctx.restore();
        } else {
          // Draw placeholder rectangle
          ctx.fillStyle = isPlayer1 ? '#FF6B6B' : '#4ECDC4';
          ctx.fillRect(drawX, drawY, metadata.frameWidth, metadata.frameHeight);

          // Draw border
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.strokeRect(drawX, drawY, metadata.frameWidth, metadata.frameHeight);
        }

        // Draw character name and action
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${player.character}`, drawX + 10, drawY + 30);
        ctx.font = '12px monospace';
        ctx.fillText(`${player.action}`, drawX + 10, drawY + 50);
      });

      requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }, [gameState]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-primary-bg">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-highlight-yellow"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default GameArena;
