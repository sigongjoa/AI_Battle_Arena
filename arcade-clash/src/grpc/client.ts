import { createChannel, createClient } from "nice-grpc-web";
import { GameServiceDefinition } from "./game";
import { TrainingServiceDefinition } from "./training";

// The gRPC-web proxy (Envoy) is expected to be running on this address.
const channel = createChannel("http://localhost:8080");

export const gameClient = createClient(GameServiceDefinition, channel);
export const trainingClient = createClient(TrainingServiceDefinition, channel);
