const listeners = new Set();
export const eventBus = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(event) {
    listeners.forEach((fn) => fn(event));
  },
};
