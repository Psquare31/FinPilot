class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, listener) {
        const listeners = this.listeners.get(event) ?? new Set();
        listeners.add(listener);
        this.listeners.set(event, listeners);

        return () => listeners.delete(listener);
    }

    async emit(event, payload) {
        const listeners = this.listeners.get(event) ?? [];
        await Promise.all([...listeners].map((listener) => listener(payload)));
    }
}

export default new EventBus();
