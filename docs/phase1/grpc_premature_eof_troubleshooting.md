# gRPC `ConnectError: [invalid_argument] parse binary: premature EOF` Troubleshooting

## 🚦 Cause Analysis

The error `ConnectError: [invalid_argument] parse binary: premature EOF` indicates that the frontend received a gRPC response that did not conform to the expected protocol message format, leading to a parsing failure.

This problem typically arises from one or more of the following reasons:

### 1. Protocol Buffer (Proto) Synchronization Mismatch

*   **Scenario:** Changes were made to the `.proto` definition (e.g., `game.proto`, `PlayerState` message) by adding new fields like `player_id` or `status`.
*   **Problem:** While the backend code might have been regenerated, the frontend's `protoc-gen-es` / `protoc-gen-connect-es` generated code might still be based on an older version of the `.proto` definition. This leads to the frontend expecting a different message structure than what the backend is actually sending.

### 2. Field Number (Tag) Inconsistency

*   **Scenario:** Field numbers (tags) in the `.proto` definition are crucial for serialization and deserialization. If a field's tag is changed or a new field is inserted with a tag that was previously used by another field, it can cause inconsistencies.
*   **Example:** If `super_gauge = 8;` was originally defined, and then `status = 8;` was added, requiring `super_gauge` to be renumbered to `9;`. If the frontend is still using the old `.proto` definition, it will expect a numeric field at tag `8` but receive a string (or vice-versa), leading to a parsing error like `premature EOF`.

### 3. Premature Server Termination

*   **Scenario:** If the backend gRPC stream terminates unexpectedly or prematurely (e.g., due to an unhandled exception, a crash, or an explicit stream closure before the full message is sent), the frontend will receive an incomplete message.
*   **Problem:** This incomplete message cannot be fully parsed according to the `.proto` definition, resulting in a `premature EOF` error.

## ✅ Resolution Steps

To resolve the `premature EOF` error, follow these steps to ensure full synchronization between your `.proto` definitions, generated code, and running services:

### 1. Verify `game.proto` Definition

Ensure that the `PlayerState` message in `backend/proto/game.proto` has the correct and consistent field definitions and unique tag numbers.

**Example of a correct `PlayerState` definition:**

```protobuf
message PlayerState {
  string player_id = 1;
  string character = 2; // e.g., "RYU", "KEN"
  int32 x = 3;
  int32 y = 4;
  string action = 5; // e.g., "idle", "punch", "kick"
  int32 frame = 6;
  int32 health = 7;
  string status = 8;       // ✅ Newly added field
  int32 super_gauge = 9;   // ✅ Field number incremented
}
```

**Key Check:** Confirm that there are no duplicate field numbers (tags) and that the types match what is expected in your application logic.

### 2. Regenerate Backend Protobuf Code

Run the `protoc` command from the **project root** to ensure correct relative imports and package structure for the generated Python code.

```bash
# From the project root directory: /mnt/d/progress/AI_Battle_Arena
python -m grpc_tools.protoc \
  -I=backend/proto \
  --python_out=backend/proto_gen \
  --grpc_python_out=backend/proto_gen \
  backend/proto/game.proto \
  backend/proto/training.proto

# Ensure the __init__.py file exists for Python package recognition
touch backend/proto_gen/__init__.py
```

**Important Note on Python Imports:** The `grpc_tools.protoc` command for Python often generates simple `import module_pb2` statements instead of `from package import module_pb2`. If you encounter `ModuleNotFoundError` or similar issues, you may need to manually adjust these imports in the generated `_grpc.py` files (e.g., `game_pb2_grpc.py`, `training_pb2_grpc.py`) to:

```python
from backend.proto_gen import game_pb2 as game__pb2
```

### 3. Regenerate Frontend Protobuf Code

Run the `protoc` command for the frontend from the **project root** to ensure the TypeScript code reflects the latest `.proto` definitions.

```bash
# From the project root directory: /mnt/d/progress/AI_Battle_Arena
protoc \
  --plugin=protoc-gen-es=./arcade-clash/node_modules/.bin/protoc-gen-es \
  --plugin=protoc-gen-connect-es=./arcade-clash/node_modules/.bin/protoc-gen-connect-es \
  -I=backend/proto \
  --es_out=arcade-clash/src/grpc \
  --connect-es_out=arcade-clash/src/grpc \
  backend/proto/game.proto \
  backend/proto/training.proto
```

### 4. Restart Both Backend and Frontend Services

After regenerating the code on both sides, it is crucial to restart both the backend and frontend services to ensure they load the newly generated code.

```bash
# Restart Backend (from backend directory or project root if paths are adjusted)
# Example from project root:
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload

# Restart Frontend (from arcade-clash directory)
cd arcade-clash
npm run dev
```

### 5. Verifying with MCP (Gemini CLI)

After performing the above steps, you can use the Gemini CLI's `chrome-devtools` tools to verify that the application is functioning as expected and that the gRPC errors have been resolved.

#### a. Navigate to the Frontend Application

First, navigate your browser to the frontend application's URL (e.g., `http://localhost:5174/`).

```tool_code
print(default_api.navigate_page(url = "http://localhost:5174/"))
```

#### b. Take a Snapshot of the Page

To inspect the elements on the page and confirm the UI is loaded correctly, take a snapshot.

```tool_code
print(default_api.take_snapshot())
```

#### c. Interact with the Application (e.g., Start Game, Select Characters)

You can simulate user interactions, such as clicking buttons. For example, to start the game and select characters:

```tool_code
# Click the "Start Game" button (replace UID with the actual UID from your snapshot)
print(default_api.click(uid = "83_3"))

# Click "Ryu" for Player 1 (replace UID with the actual UID from your snapshot)
print(default_api.click(uid = "85_4"))

# Click "Ken" for Player 2 (replace UID with the actual UID from your snapshot)
print(default_api.click(uid = "86_6"))
```

#### d. Check Console Logs for Errors

Crucially, after interacting with the application, check the console logs to ensure that the `ConnectError` messages are no longer appearing.

```tool_code
print(default_api.list_console_messages())
```

Look for the absence of `ConnectError` messages, especially those related to `premature EOF` or `signal is aborted without reason`. The presence of these errors indicates that the gRPC communication issue persists.

## 📌 Summary

The `premature EOF` error is most commonly a symptom of a protocol buffer version mismatch between the client (frontend) and the server (backend). By consistently defining your `.proto` files, regenerating the code for both sides, and restarting all relevant services, you can resolve these synchronization issues.
