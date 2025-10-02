type Listener = (...args: any[]) => void;

export class SimpleEventEmitter {
    private listeners: { [event: string]: Listener[] } = {};

    public on(event: string, listener: Listener): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    public off(event: string, listener?: Listener): void {
        if (!this.listeners[event]) return;

        if (listener) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        } else {
            delete this.listeners[event];
        }
    }

    public emit(event: string, ...args: any[]): void {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(listener => {
            try {
                listener(...args);
            } catch (e) {
                console.error(`Error in listener for event '${event}':`, e);
            }
        });
    }
}
