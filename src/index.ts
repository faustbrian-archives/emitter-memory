import { EventListener, EventName, IEventDispatcher } from "@emittr/emittr";

export class MemoryDispatcher implements IEventDispatcher {
	private readonly listeners: Map<EventName, Set<EventListener>> = new Map<EventName, Set<EventListener>>();

	public listen(event: EventName, listener: EventListener): () => void {
		this.getListenersForEvent(event).add(listener);

		return this.forget.bind(this, event, listener);
	}

	public listenMany(events: Array<[EventName, EventListener]>): Map<EventName, () => void> {
		const listeners: Map<EventName, () => void> = new Map();

		for (const [event, listener] of events) {
			listeners.set(event, this.listen(event, listener));
		}

		return listeners;
	}

	public listenOnce(name: EventName, listener: EventListener): void {
		const off: () => void = this.listen(name, (event, data) => {
			off();

			listener(event, data);
		});
	}

	public forget(event: EventName, listener: EventListener): void {
		this.getListenersForEvent(event).delete(listener);
	}

	public forgetMany(events: Array<[EventName, EventListener]>): void {
		for (const [event, listener] of events) {
			this.forget(event, listener);
		}
	}

	public flush(): void {
		this.listeners.clear();
	}

	public getListeners(event?: EventName): EventListener[] {
		return Array.from(this.getListenersForEvent(event));
	}

	public hasListeners(event: EventName): boolean {
		return this.getListenersForEvent(event).size > 0;
	}

	public async dispatch(event: EventName, data?: any): Promise<void> {
		await Promise.resolve();

		await Promise.all(
			Array.from(this.getListenersForEvent(event)).map((listener: EventListener) => listener(event, data)),
		);
	}

	public async dispatchSeq(event: EventName, data?: any): Promise<void> {
		await Promise.resolve();

		for (const listener of this.getListenersForEvent(event).values()) {
			await listener(event, data);
		}
	}

	public dispatchSync(event: EventName, data?: any): void {
		for (const listener of this.getListenersForEvent(event).values()) {
			listener(event, data);
		}
	}

	public async dispatchMany(events: Array<[EventName, any]>): Promise<void> {
		await Promise.all(Object.values(events).map((value: [EventName, any]) => this.dispatch(value[0], value[1])));
	}

	public async dispatchManySeq(events: Array<[EventName, any]>): Promise<void> {
		for (const value of Object.values(events)) {
			await this.dispatchSeq(value[0], value[1]);
		}
	}

	public dispatchManySync(events: Array<[EventName, any]>): void {
		for (const value of Object.values(events)) {
			this.dispatchSync(value[0], value[1]);
		}
	}

	private getListenersForEvent(name: EventName): Set<EventListener> {
		if (!this.listeners.has(name)) {
			this.listeners.set(name, new Set());
		}

		return this.listeners.get(name);
	}
}
