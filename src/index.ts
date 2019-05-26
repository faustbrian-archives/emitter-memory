import { EventListener, EventName, IEventDispatcher } from "@emittr/emittr";
import mm from "micromatch";

export class MemoryDispatcher implements IEventDispatcher {
	private readonly listeners: Map<EventName, Set<EventListener>> = new Map<EventName, Set<EventListener>>();

	public listen(event: EventName, listener: EventListener): () => void {
		this.getListenersByEvent(event).add(listener);

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
		this.getListenersByEvent(event).delete(listener);
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
		return Array.from(this.getListenersByEvent(event));
	}

	public hasListeners(event: EventName): boolean {
		return this.getListenersByEvent(event).size > 0;
	}

	public async dispatch<T = any>(event: EventName, data?: T): Promise<void> {
		await Promise.resolve();

		const resolvers: Array<Promise<void>> = [];

		for (const [e, eventListeners] of this.getListenersByPattern(event).entries()) {
			for (const listener of eventListeners) {
				resolvers.push(new Promise(resolve => resolve(listener(e, data))));
			}
		}

		await Promise.all(resolvers);
	}

	public async dispatchSeq<T = any>(event: EventName, data?: T): Promise<void> {
		await Promise.resolve();

		for (const [e, eventListeners] of this.getListenersByPattern(event).entries()) {
			for (const listener of eventListeners) {
				await listener(e, data);
			}
		}
	}

	public dispatchSync<T = any>(event: EventName, data?: T): void {
		for (const [e, eventListeners] of this.getListenersByPattern(event).entries()) {
			for (const listener of eventListeners) {
				listener(e, data);
			}
		}
	}

	public async dispatchMany<T = any>(events: Array<[EventName, T]>): Promise<void> {
		await Promise.all(Object.values(events).map((value: [EventName, T]) => this.dispatch(value[0], value[1])));
	}

	public async dispatchManySeq<T = any>(events: Array<[EventName, T]>): Promise<void> {
		for (const value of Object.values(events)) {
			await this.dispatchSeq(value[0], value[1]);
		}
	}

	public dispatchManySync<T = any>(events: Array<[EventName, T]>): void {
		for (const value of Object.values(events)) {
			this.dispatchSync(value[0], value[1]);
		}
	}

	private getListenersByEvent(name: EventName): Set<EventListener> {
		if (!this.listeners.has(name)) {
			this.listeners.set(name, new Set());
		}

		return this.listeners.get(name);
	}

	private getListenersByPattern(event: EventName): Map<EventName, EventListener[]> {
		// @ts-ignore
		const matches: EventName[] = mm([...this.listeners.keys()], event);

		const listeners: Map<EventName, EventListener[]> = new Map<EventName, EventListener[]>();
		for (const match of matches) {
			const eventListeners: Set<EventListener> = this.getListenersByEvent(match);

			if (eventListeners.size > 0) {
				listeners.set(match, Array.from(eventListeners));
			}
		}

		return listeners;
	}
}
