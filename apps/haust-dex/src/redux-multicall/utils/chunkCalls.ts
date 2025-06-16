import {
  CHUNK_GAS_LIMIT,
  DEFAULT_CALL_GAS_REQUIRED,
  MAX_CHUNK_SIZE,
} from "../constants";
import type { Call } from "../types";

export default function chunkCalls(
  calls: Call[],
  gasLimit = CHUNK_GAS_LIMIT
): Call[][] {
  const chunks: Call[][] = [];
  let currentChunk: Call[] = [];
  let currentChunkGasLimit = 0;

  calls.forEach((call) => {
    const gasRequired = call.gasRequired ?? DEFAULT_CALL_GAS_REQUIRED;

    // Split if either gas limit is reached or max chunk size
    if (
      currentChunkGasLimit + gasRequired > gasLimit ||
      currentChunk.length >= MAX_CHUNK_SIZE
    ) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChunkGasLimit = 0;
    }

    currentChunk.push(call);
    currentChunkGasLimit += gasRequired;
  });

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
