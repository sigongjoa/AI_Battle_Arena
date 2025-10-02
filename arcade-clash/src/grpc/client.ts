import { createGrpcWebTransport } from "@bufbuild/connect-web";
import { createPromiseClient } from "@bufbuild/connect";
import { GameService, ControllService } from "./game_connect";
import { TrainingService } from "./training_connect";

const transport = createGrpcWebTransport({
  baseUrl: "http://localhost:8080", // Envoy endpoint
  useBinaryFormat: true,
});

export const gameClient = createPromiseClient(GameService, transport);
export const trainingClient = createPromiseClient(TrainingService, transport);
export const controllClient = createPromiseClient(ControllService, transport);