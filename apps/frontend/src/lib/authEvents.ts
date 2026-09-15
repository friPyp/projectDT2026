// Tiny pub/sub so api.ts (outside React) can tell AuthProvider a
// session has expired (token invalid/expired server-side), without
// importing React context into the fetch layer. No new library.
type Listener = () => void;
const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionExpired() {
  listeners.forEach((listener) => listener());
}
