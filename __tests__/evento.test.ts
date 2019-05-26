import "jest-extended";
import { MemoryDispatcher } from "../src";

let dispatcher: MemoryDispatcher;
beforeEach(() => (dispatcher = new MemoryDispatcher()));

describe(".listen", () => {
	it("should add an event listener", async () => {
		const calls: number[] = [];
		dispatcher.listen("firstEvent", () => calls.push(1));
		dispatcher.listen("firstEvent", () => calls.push(2));

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1, 2]);
	});

	it("should return an unsubcribe method for an event listener", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		const off = dispatcher.listen("firstEvent", listener);
		await dispatcher.dispatch("firstEvent");
		expect(calls).toEqual([1]);

		off();
		await dispatcher.dispatch("firstEvent");
		expect(calls).toEqual([1]);
	});

	it("should prevent duplicate listeners", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		dispatcher.listen("firstEvent", listener);
		dispatcher.listen("firstEvent", listener);
		dispatcher.listen("firstEvent", listener);

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1]);
	});
});

describe(".listenMany", () => {
	it("should add many event listeners", async () => {
		const calls: number[] = [];
		dispatcher.listenMany([["firstEvent", () => calls.push(1)], ["secondEvent", () => calls.push(2)]]);

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1]);

		await dispatcher.dispatch("secondEvent");

		expect(calls).toEqual([1, 2]);
	});

	it("should prevent duplicate listeners", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		dispatcher.listenMany([["firstEvent", listener], ["firstEvent", listener], ["firstEvent", listener]]);

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1]);
	});
});

describe(".listenOnce", () => {
	it("should listen once", async () => {
		let unicorn: boolean = false;

		expect(unicorn).toBeFalse();

		dispatcher.listenOnce("firstEvent", (_, data) => {
			unicorn = data;
		});

		await dispatcher.dispatchSeq("firstEvent", true);

		expect(unicorn).toBeTrue();

		await dispatcher.dispatchSeq("firstEvent", false);

		expect(unicorn).toBeTrue();
	});
});

describe(".forget", () => {
	it("should remove an event listener", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		dispatcher.listen("firstEvent", listener);

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1]);

		dispatcher.forget("firstEvent", listener);

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1]);
	});
});

describe(".dispatch", () => {
	it("should emit one event", () => {
		dispatcher.listen("firstEvent", (_, data) => {
			expect(data).toEqual(true);
		});

		dispatcher.dispatch("firstEvent", true);
	});

	it("should emit multiple events", () => {
		let count = 0;

		dispatcher.listen("firstEvent", () => {
			if (++count >= 5) {
				expect(count).toBe(5);
			}
		});

		dispatcher.dispatch("firstEvent");
		dispatcher.dispatch("firstEvent");
		dispatcher.dispatch("firstEvent");
		dispatcher.dispatch("firstEvent");
		dispatcher.dispatch("firstEvent");
	});

	it("should not execute an event listener without await", () => {
		let unicorn: boolean = false;

		dispatcher.listen("firstEvent", () => (unicorn = true));

		dispatcher.dispatch("firstEvent");

		expect(unicorn).toBeFalse();
	});
});

describe(".dispatchSeq", () => {
	it("should not execute an event listener without await (async behaviour)", () => {
		let unicorn: boolean = false;

		dispatcher.listen("firstEvent", () => (unicorn = true));

		dispatcher.dispatchSeq("firstEvent");

		expect(unicorn).toBeFalse();
	});

	// it("should not execute a wildcard listener without await (async behaviour)", () => {
	// 	let unicorn: boolean = false;

	// 	dispatcher.onAny(() => (unicorn = true));

	// 	dispatcher.dispatchSeq("firstEvent");

	// 	expect(unicorn).toBeFalse();
	// });

	it("should emit all events in sequence", () => {
		const events: number[] = [];

		const listener = async (data: any) => {
			events.push(data);

			if (events.length >= 3) {
				expect(events).toEqual([1, 2, 3]);
			}
		};

		dispatcher.listen("firstEvent", () => listener(1));
		dispatcher.listen("firstEvent", () => listener(2));
		dispatcher.listen("firstEvent", () => listener(3));

		dispatcher.dispatchSeq("firstEvent");
	});
});

describe(".dispatchSync", () => {
	it("should execute an event listener without await", () => {
		let unicorn: boolean = false;

		dispatcher.listen("firstEvent", () => (unicorn = true));

		dispatcher.dispatchSync("firstEvent");

		expect(unicorn).toBeTrue();
	});

	// it("should execute a wildcard listener without await", () => {
	// 	let unicorn: boolean = false;

	// 	dispatcher.onAny(() => (unicorn = true));

	// 	dispatcher.emitSync("firstEvent");

	// 	expect(unicorn).toBeTrue();
	// });

	it("should emit all events in sequence", () => {
		const events: number[] = [];

		const listener = async (data: any) => {
			events.push(data);

			if (events.length >= 3) {
				expect(events).toEqual([1, 2, 3]);
			}
		};

		dispatcher.listen("firstEvent", () => listener(1));
		dispatcher.listen("firstEvent", () => listener(2));
		dispatcher.listen("firstEvent", () => listener(3));

		dispatcher.dispatchSync("firstEvent");
	});
});

// describe(".onAny", () => {
// 	it("should add a wildcard listener", async () => {
// 		dispatcher.onAny((eventName, data) => {
// 			expect(eventName).toBe("firstEvent");
// 			expect(data).toEqual(true);
// 		});

// 		await dispatcher.emit("firstEvent", true);
// 		await dispatcher.dispatchSeq("firstEvent", true);
// 	});
// });

// describe(".offAny", () => {
// 	it("should remove a wildcard listener", async () => {
// 		const calls: number[] = [];
// 		const listener = () => calls.push(1);

// 		dispatcher.onAny(listener);

// 		await dispatcher.emit("firstEvent");

// 		expect(calls).toEqual([1]);

// 		dispatcher.offAny(listener);

// 		await dispatcher.emit("firstEvent");

// 		expect(calls).toEqual([1]);
// 	});
// });

// describe(".clearListeners", () => {
// 	it("should clear all listeners", async () => {
// 		const calls: string[] = [];

// 		dispatcher.on("firstEvent", () => calls.push("firstEvent"));
// 		dispatcher.on("secondEvent", () => calls.push("secondEvent"));
// 		dispatcher.onAny(() => calls.push("any"));

// 		await dispatcher.emit("firstEvent");
// 		await dispatcher.emit("secondEvent");

// 		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any"]);

// 		dispatcher.clearListeners();

// 		await dispatcher.emit("firstEvent");
// 		await dispatcher.emit("secondEvent");

// 		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any"]);
// 	});

// 	it("should clear all listeners for an event", async () => {
// 		const calls: string[] = [];

// 		dispatcher.on("firstEvent", () => calls.push("firstEvent"));
// 		dispatcher.on("secondEvent", () => calls.push("secondEvent"));
// 		dispatcher.onAny(() => calls.push("any"));

// 		await dispatcher.emit("firstEvent");
// 		await dispatcher.emit("secondEvent");

// 		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any"]);

// 		dispatcher.clearListeners("firstEvent");

// 		await dispatcher.emit("firstEvent");
// 		await dispatcher.emit("secondEvent");

// 		expect(calls).toEqual(["firstEvent", "any", "secondEvent", "any", "any", "secondEvent", "any"]);
// 	});
// });

// describe(".listenerCount", () => {
// 	it("should return the total listener count", () => {
// 		dispatcher.on("firstEvent", () => null);
// 		dispatcher.on("secondEvent", () => null);
// 		dispatcher.onAny(() => null);

// 		expect(dispatcher.listenerCount("firstEvent")).toBe(2);
// 		expect(dispatcher.listenerCount("secondEvent")).toBe(2);
// 		expect(dispatcher.listenerCount()).toBe(3);
// 	});
// });

// describe(".listeners", () => {
// 	it("should return the total listener count", () => {
// 		const listener = (): null => null;

// 		dispatcher.on("firstEvent", listener);

// 		expect(dispatcher.listeners("firstEvent")).toEqual(new Set([listener]));
// 	});
// });

// describe(".rawListeners", () => {
// 	it("should return the total listener count", () => {
// 		const listener = (): null => null;

// 		dispatcher.on("firstEvent", listener);

// 		expect(dispatcher.rawListeners("firstEvent")).toEqual([listener]);
// 	});
// });

// describe(".eventNames", () => {
// 	it("should return the total listener count", () => {
// 		dispatcher.on("firstEvent", () => null);
// 		dispatcher.on("secondEvent", () => null);
// 		dispatcher.onAny(() => null);

// 		expect(dispatcher.eventNames()).toEqual(["firstEvent", "secondEvent"]);
// 	});
// });
