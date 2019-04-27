export type EventName = string | symbol;
export type EventHandler = (eventData: any) => void;
export type WildcardEventHandler = (eventName: EventName, eventData: any) => void;

export class Evento {
	private readonly listenersWildcard: Set<WildcardEventHandler> = new Set<WildcardEventHandler>();
	private readonly listenersEvent: Map<EventName, Set<EventHandler>> = new Map<EventName, Set<EventHandler>>();

	public on(eventName: EventName, listener: EventHandler): () => void {
		this.getListeners(eventName).add(listener);

		return this.off.bind(this, eventName, listener);
	}

	public off(eventName: EventName, listener: EventHandler): void {
		this.getListeners(eventName).delete(listener);
	}

	public once(eventName: EventName, listener: EventHandler): void {
		const off: () => void = this.on(eventName, data => {
			off();

			listener(data);
		});
	}

	public async emit(eventName: EventName, eventData?: any): Promise<void> {
		const listenersEvent: Set<EventHandler> = this.getListeners(eventName);
		const listenersWildcard: Set<WildcardEventHandler> = this.listenersWildcard;

		await Promise.all([
			Array.from(listenersEvent).map((listener: EventHandler) => {
				if (listenersEvent.has(listener)) {
					return listener(eventData);
				}
			}),
			Array.from(listenersWildcard).map((listener: WildcardEventHandler) => {
				if (listenersWildcard.has(listener)) {
					return listener(eventName, eventData);
				}
			}),
		]);
	}

	public async emitSeq(eventName: EventName, eventData?: any): Promise<void> {
		const listeners: Set<EventHandler> = this.getListeners(eventName);

		for (const listener of listeners.values()) {
			if (listeners.has(listener)) {
				await listener(eventData);
			}
		}

		const listenersWildcard: Set<WildcardEventHandler> = this.listenersWildcard;

		for (const listener of listenersWildcard.values()) {
			if (listenersWildcard.has(listener)) {
				await listener(eventName, eventData);
			}
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
			this.getListeners(eventName).clear();
		} else {
			this.listenersWildcard.clear();
			this.listenersEvent.clear();
		}
	}

	public listenerCount(eventName?: EventName): number {
		if (eventName) {
			return this.listenersWildcard.size + this.getListeners(eventName).size;
		}

		let count: number = this.listenersWildcard.size;

		for (const value of this.listenersEvent.values()) {
			count += value.size;
		}

		return count;
	}

	private getListeners(eventName: EventName): Set<EventHandler> {
		if (!this.listenersEvent.has(eventName)) {
			this.listenersEvent.set(eventName, new Set());
		}

		return this.listenersEvent.get(eventName);
	}
}
