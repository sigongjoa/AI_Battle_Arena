import React, { useEffect } from "react";

// This component will be responsible for capturing user input and sending it over WebRTC.
// The actual WebRTC client will be passed in as a prop.

export const GameInputProvider: React.FC<{ webRtcClient: any, children: React.ReactNode }> = ({ webRtcClient, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let action: string | null = null;

      if (e.key === "ArrowLeft") {
        action = "LEFT";
      } else if (e.key === "ArrowRight") {
        action = "RIGHT";
      } else if (e.key === " ") {
        action = "PUNCH";
      }

      if (action && webRtcClient) {
        // Send the input over WebRTC
        webRtcClient.send(JSON.stringify({ type: 'input', action }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [webRtcClient]);

  return <>{children}</>;
};
