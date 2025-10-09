# Implementation Discrepancies and Refactoring Plan

This document outlines the major discrepancies found between the frontend and backend implementations, the history of the architectural changes, and the plan to resolve these issues.

## 1. Summary of Discrepancies

The core issue is a major architectural mismatch between the frontend and backend:

*   **Frontend**: The `HUD.tsx` and `GameInputProvider.tsx` components are implemented to use a **gRPC-based** communication protocol to send player input and receive game state updates.
*   **Backend**: The backend is implemented to use a **WebSocket-based signaling server and WebRTC** for peer-to-peer communication. It does not have a gRPC server for real-time game communication.

This mismatch is the reason for the `Failed to resolve import "../src/grpc/client"` error, as the gRPC client code does not exist and would not be able to communicate with the current backend even if it did.

## 2. Project History and Architectural Pivot

Analysis of the `docs` directory reveals the following history:

1.  **Initial Plan**: The project likely started with a WebSocket-based approach.
2.  **Phase 3: gRPC Migration**: A detailed plan was made to migrate to a gRPC-based architecture. The current frontend code in `HUD.tsx` and `GameInputProvider.tsx` was likely written during this phase.
3.  **Phase 5: Pivot back to WebRTC**: A decision was made to abandon the gRPC plan and revert to using WebRTC, as documented in `docs/phase5_battle_rhythm/기술_명세서.md`. The reason cited was to "reduce architectural complexity and maintain consistency."
4.  **Current State**: The backend reflects the WebRTC architecture, but the frontend was never fully updated after the pivot away from gRPC, leaving it in a broken and inconsistent state.

## 3. Refactoring Plan

To resolve these discrepancies, the following refactoring has been performed:

1.  **Removed gRPC from `GameInputProvider.tsx`**: The gRPC-based input sending logic was replaced with a WebRTC-based implementation that uses a `webRtcClient` prop to send player input.
2.  **Removed gRPC from `HUD.tsx`**: The gRPC-based game state streaming was replaced with a WebRTC-based implementation that uses a `webRtcClient` prop to receive game state updates.
3.  **Updated `App.tsx`**: The top-level `App.tsx` component was modified to initialize the `SignalingClient` and `WebRtcClient` and pass the `webRtcClient` instance down to the `GameScreen` component.
4.  **Updated `GameScreen.tsx`**: The `GameScreen.tsx` component was modified to accept the `webRtcClient` prop and pass it down to the `HUD` component.

## 4. Documentation Updates

*   **`docs/phase4/progress_summary_20251005.md`**: This document was updated to remove references to the obsolete PeerJS server and clarify the use of the custom backend signaling server.
*   **`docs/phase4/frontend_wireframe.md`**: A new document was created to describe the wireframe and component structure of the main game screen.
*   **This Document (`docs/phase4/implementation_discrepancies.md`)**: This document serves as a record of the identified discrepancies and the actions taken to resolve them.

With these changes, the frontend and backend are now aligned on a WebRTC-based communication architecture. The next step is to complete the E2E testing to verify the full end-to-end functionality.
