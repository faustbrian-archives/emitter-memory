export type EventName = string | symbol;
export type EventHandler = (eventData: any) => void;
export type WildcardEventHandler = (eventName: EventName, eventData: any) => void;

export class Evento {
	private readonly listenersWildcard: Set<WildcardEventHandler> = new Set<WildcardEventHandler>();
	private readonly listenersEvent: Map<EventName, Set<EventHandler>> = new Map<EventName, Set<EventHandler>>();

	public on(eventName: EventName, listener: EventHandler): () => void {
		this.listeners(eventName).add(listener);

		return this.off.bind(this, eventName, listener);
	}

	public off(eventName: EventName, listener: EventHandler): void {
		this.listeners(eventName).delete(listener);
	}

	public once(eventName: EventName, listener: EventHandler): void {
		const off: () => void = this.on(eventName, data => {
			off();

			listener(data);
		});
	}

	public async emit(eventName: EventName, eventData?: any): Promise<void> {
		await Promise.resolve();

		await Promise.all([
			Array.from(this.listeners(eventName)).map((listener: EventHandler) => listener(eventData)),
			Array.from(this.listenersWildcard).map((listener: WildcardEventHandler) => listener(eventName, eventData)),
		]);
	}

	public async emitSeq(eventName: EventName, eventData?: any): Promise<void> {
		await Promise.resolve();

		for (const listener of this.listeners(eventName).values()) {
			await listener(eventData);
		}

		for (const listener of this.listenersWildcard.values()) {
			await listener(eventName, eventData);
		}
	}

	public emitSync(eventName: EventName, eventData?: any): void {
		for (const listener of this.listeners(eventName).values()) {
			listener(eventData);
		}

		for (const listener of this.listenersWildcard.values()) {
			listener(eventName, eventData);
		}
	}

	public onAny(listener: WildcardEventHandler): () => void {
		this.listenersWildcard.add(listener);

		return this.offAny.bind(this, listener);
	}

	public offAny(listener: WildcardEventHandler): void {
		this.listenersWildcard.delete(listener);
	}

	public clearListeners(eventName?: EventName): void {
		if (eventName) {
			this.listeners(eventName).clear();
		} else {
			this.listenersWildcard.clear();
			this.listenersEvent.clear();
		}
	}

	public listenerCount(eventName?: EventName): number {
		if (eventName) {
			return this.listenersWildcard.size + this.listeners(eventName).size;
		}

		let count: number = this.listenersWildcard.size;

		for (const value of this.listenersEvent.values()) {
			count += value.size;
		}

		return count;
	}

	public listeners(eventName: EventName): Set<EventHandler> {
		if (!this.listenersEvent.has(eventName)) {
			this.listenersEvent.set(eventName, new Set());
		}

		return this.listenersEvent.get(eventName);
	}

	public eventNames(): EventName[] {
		return [...this.listenersEvent.keys()];
	}
}
