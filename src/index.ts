/* eslint-disable @typescript-eslint/await-thenable */

export type EventName = string | symbol;
export type EventHandler = (data: any) => void;
export type WildcardEventHandler = (name: EventName, data: any) => void;

export class Evento {
	private readonly listenersWildcard: Set<WildcardEventHandler> = new Set<WildcardEventHandler>();
	private readonly listenersEvent: Map<EventName, Set<EventHandler>> = new Map<
		EventName,
		Set<EventHandler>
	>();

	public on(name: EventName, listener: EventHandler): () => void {
		this.listeners(name).add(listener);

		return this.off.bind(this, name, listener);
	}

	public off(name: EventName, listener: EventHandler): void {
		this.listeners(name).delete(listener);
	}

	public once(name: EventName, listener: EventHandler): void {
		const off: () => void = this.on(name, (data) => {
			off();

			listener(data);
		});
	}

	public async emit(name: EventName, data?: any): Promise<void> {
		await Promise.resolve();

		await Promise.all([
			Array.from(this.listeners(name)).map((listener: EventHandler) =>
				listener(data)
			),
			Array.from(this.listenersWildcard).map((listener: WildcardEventHandler) =>
				listener(name, data)
			),
		]);
	}

	public async emitSeq(name: EventName, data?: any): Promise<void> {
		await Promise.resolve();

		for (const listener of this.listeners(name).values()) {
			await listener(data);
		}

		for (const listener of this.listenersWildcard.values()) {
			await listener(name, data);
		}
	}

	public emitSync(name: EventName, data?: any): void {
		for (const listener of this.listeners(name).values()) {
			listener(data);
		}

		for (const listener of this.listenersWildcard.values()) {
			listener(name, data);
		}
	}

	public onAny(listener: WildcardEventHandler): () => void {
		this.listenersWildcard.add(listener);

		return this.offAny.bind(this, listener);
	}

	public offAny(listener: WildcardEventHandler): void {
		this.listenersWildcard.delete(listener);
	}

	public clearListeners(name?: EventName): void {
		if (name) {
			this.listeners(name).clear();
		} else {
			this.listenersWildcard.clear();
			this.listenersEvent.clear();
		}
	}

	public listenerCount(name?: EventName): number {
		if (name) {
			return this.listenersWildcard.size + this.listeners(name).size;
		}

		let count: number = this.listenersWildcard.size;

		for (const value of this.listenersEvent.values()) {
			count += value.size;
		}

		return count;
	}

	public listeners(name: EventName): Set<EventHandler> {
		if (!this.listenersEvent.has(name)) {
			this.listenersEvent.set(name, new Set());
		}

		return this.listenersEvent.get(name)!;
	}

	public rawListeners(name: EventName): EventHandler[] {
		return [...this.listeners(name)];
	}

	public eventNames(): EventName[] {
		return [...this.listenersEvent.keys()];
	}
}
