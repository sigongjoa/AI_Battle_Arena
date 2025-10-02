import React, { useEffect } from "react";
import { gameClient } from "../src/grpc/client";
import { PlayerInput } from "../src/grpc/game_pb"; // 입력 메시지

export const GameInputProvider: React.FC = ({ children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let input: PlayerInput | null = null;

      if (e.key === "ArrowLeft") {
        input = new PlayerInput({ action: "LEFT" });
      } else if (e.key === "ArrowRight") {
        input = new PlayerInput({ action: "RIGHT" });
      } else if (e.key === " ") {
        input = new PlayerInput({ action: "PUNCH" });
      }

      if (input) {
        // 🔑 client-streaming 대신 매번 Unary 호출
        gameClient.sendPlayerInput(input)
          .catch(err => console.error("sendPlayerInput error:", err));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return <>{children}</>;
};
