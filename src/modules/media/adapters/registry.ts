import type { MediaSourceAdapter } from "@/modules/media/adapters/types";

const adapters: MediaSourceAdapter[] = [];

export function registerAdapter(adapter: MediaSourceAdapter) {
  adapters.push(adapter);
}

export function resolveAdapter(
  input: Parameters<MediaSourceAdapter["supports"]>[0],
): MediaSourceAdapter {
  const adapter = adapters.find((a) => a.supports(input));
  if (!adapter) {
    throw new Error(
      `No media source adapter registered for input: ${JSON.stringify(input)}`,
    );
  }
  return adapter;
}
