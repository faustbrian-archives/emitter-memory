import "jest-extended";
import { Evento } from "../src";

let emitter: Evento;
beforeEach(() => (emitter = new Evento()));

describe(".on", () => {
	it("should add an event listener", async () => {
		const calls: number[] = [];
		emitter.on("firstEvent", () => calls.push(1));
		emitter.on("firstEvent", () => calls.push(2));

		await emitter.emit("firstEvent");

		expect(calls).toEqual([1, 2]);
	});

	it("should return an unsubcribe method for an event listener", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		const off = emitter.on("firstEvent", listener);
		await emitter.emit("firstEvent");
		expect(calls).toEqual([1]);

		off();
		await emitter.emit("firstEvent");
		expect(calls).toEqual([1]);
	});

	it("should prevent duplicate listeners", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		emitter.on("firstEvent", listener);
		emitter.on("firstEvent", listener);
		emitter.on("firstEvent", listener);

		await emitter.emit("firstEvent");

		expect(calls).toEqual([1]);
	});
});

describe(".off", () => {
	it("should remove an event listener", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		emitter.on("firstEvent", listener);

		await emitter.emit("firstEvent");

		expect(calls).toEqual([1]);

		emitter.off("firstEvent", listener);

		await emitter.emit("firstEvent");

		expect(calls).toEqual([1]);
	});
});

describe(".once", () => {
	it("should listen once", async () => {
		let unicorn: boolean = false;

		expect(unicorn).toBeFalse();

		emitter.once("firstEvent", data => {
			unicorn = data;
		});

		await emitter.emitSeq("firstEvent", true);

		expect(unicorn).toBeTrue();

		await emitter.emitSeq("firstEvent", false);

		expect(unicorn).toBeTrue();
	});
});

describe(".emit", () => {
	it("should emit one event", () => {
		emitter.on("firstEvent", data => {
			expect(data).toEqual(true);
		});

		emitter.emit("firstEvent", true);
	});

	it("should emit multiple events", () => {
		let count = 0;

		emitter.on("firstEvent", () => {
			if (++count >= 5) {
				expect(count).toBe(5);
			}
		});

		emitter.emit("firstEvent");
		emitter.emit("firstEvent");
		emitter.emit("firstEvent");
		emitter.emit("firstEvent");
		emitter.emit("firstEvent");
	});

	it("should not execute an event listener without await", () => {
		let unicorn: boolean = false;

		emitter.on("firstEvent", () => (unicorn = true));

		emitter.emit("firstEvent");

		expect(unicorn).toBeFalse();
	});
});

describe(".emitSeq", () => {
	it("should emit all events in sequence", () => {
		const events: number[] = [];

		const listener = async (data: any) => {
			events.push(data);

			if (events.length >= 3) {
				expect(events).toEqual([1, 2, 3]);
			}
		};

		emitter.on("firstEvent", () => listener(1));
		emitter.on("firstEvent", () => listener(2));
		emitter.on("firstEvent", () => listener(3));

		emitter.emitSeq("firstEvent");
	});

	it("should not execute an event listener without await", () => {
		let unicorn: boolean = false;

		emitter.on("firstEvent", () => (unicorn = true));

		emitter.emitSeq("firstEvent");

		expect(unicorn).toBeFalse();
	});
});

describe(".onAny", () => {
	it("should add a wildcard listener", async () => {
		emitter.onAny((eventName, data) => {
			expect(eventName).toBe("firstEvent");
			expect(data).toEqual(true);
		});

		await emitter.emit("firstEvent", true);
		await emitter.emitSeq("firstEvent", true);
	});
});

describe(".offAny", () => {
	it("should remove a wildcard listener", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		emitter.onAny(listener);

		await emitter.emit("firstEvent");

		expect(calls).toEqual([1]);

		emitter.offAny(listener);

		await emitter.emit("firstEvent");

		expect(calls).toEqual([1]);
	});
});

describe(".clearListeners", () => {
	it("should clear all listeners", async () => {
		const calls: string[] = [];

		emitter.on("firstEvent", () => calls.push("firstEvent"));
		emitter.on("secondEvent", () => calls.push("secondEvent"));
		emitter.onAny(() => calls.push("any"));

		await emitter.emit("firstEvent");
		await emitter.emit("secondEvent");

		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any"]);

		emitter.clearListeners();

		await emitter.emit("firstEvent");
		await emitter.emit("secondEvent");

		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any"]);
	});

	it("should clear all listeners for an event", async () => {
		const calls: string[] = [];

		emitter.on("firstEvent", () => calls.push("firstEvent"));
		emitter.on("secondEvent", () => calls.push("secondEvent"));
		emitter.onAny(() => calls.push("any"));

		await emitter.emit("firstEvent");
		await emitter.emit("secondEvent");

		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any"]);

		emitter.clearListeners("firstEvent");

		await emitter.emit("firstEvent");
		await emitter.emit("secondEvent");

		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any", "any", "secondEvent", "any"]);
	});
});

describe(".listenerCount", () => {
	it("should return the total listener count", () => {
		emitter.on("firstEvent", () => null);
		emitter.on("secondEvent", () => null);
		emitter.onAny(() => null);

		expect(emitter.listenerCount("firstEvent")).toBe(2);
		expect(emitter.listenerCount("secondEvent")).toBe(2);
		expect(emitter.listenerCount()).toBe(3);
	});
});
