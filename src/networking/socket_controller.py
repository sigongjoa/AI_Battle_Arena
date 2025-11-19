import socket
import struct
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# from input.go: const ( IB_PU InputBits = 1 << iota ... )
IB_PU = 1 << 0
IB_PD = 1 << 1
IB_PL = 1 << 2
IB_PR = 1 << 3
IB_A = 1 << 4
# ... A, B, C, X, Y, Z, S, D, W, M

HOST = "127.0.0.1"
PORT = 7500


def main():
    logger.info(f"Attempting to connect to {HOST}:{PORT}...")

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.connect((HOST, PORT))
            logger.info("Connection successful!")
        except ConnectionRefusedError as e:
            logger.error(f"Connection failed. Is Ikemen GO running in host mode? Error: {e}", exc_info=True)
            return

        # --- Handshake (based on NetInput.Synchronize) ---
        logger.info("Performing handshake...")
        try:
            # 1. Read seed from server
            seed_data = s.recv(4)
            seed = struct.unpack("<i", seed_data)[0]
            logger.info(f"Received seed: {seed}")

            # 2. Read pre-fight time from server
            pftime_data = s.recv(4)
            pftime = struct.unpack("<i", pftime_data)[0]
            logger.info(f"Received pre-fight time: {pftime}")

            # 3. Send our time (0) and read it back to sync
            s.sendall(struct.pack("<i", 0))
            s.recv(4)  # Read back our own time
            logger.info("Handshake complete.")

        except Exception as e:
            logger.error(f"An error occurred during handshake: {e}", exc_info=True)
            return

        # --- Main Control Loop ---
        logger.info("Starting AI control loop. Sending JUMP command every second.")
        while True:
            try:
                # For PoC, we just send the JUMP command (Up)
                input_bits = IB_PU

                # Pack the integer as a 4-byte little-endian and send it
                s.sendall(struct.pack("<i", input_bits))
                logger.debug("Sent JUMP command.")

                # Wait for a second
                time.sleep(1)

                # Send a neutral state (no buttons pressed)
                s.sendall(struct.pack("<i", 0))
                logger.debug("Sent NEUTRAL command.")
                time.sleep(1)

            except (BrokenPipeError, ConnectionResetError) as e:
                logger.error(f"Connection lost: {e}", exc_info=True)
                break
            except Exception as e:
                logger.error(f"An error occurred during control loop: {e}", exc_info=True)
                break


if __name__ == "__main__":
    main()
