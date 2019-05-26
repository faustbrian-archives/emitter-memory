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

describe(".forgetMany", () => {
	it("should remove many event listeners", async () => {
		const calls: number[] = [];
		const listener1 = () => calls.push(1);
		const listener2 = () => calls.push(2);

		dispatcher.listenMany([["firstEvent", listener1], ["secondEvent", listener2]]);

		await dispatcher.dispatch("firstEvent");
		await dispatcher.dispatch("secondEvent");

		expect(calls).toEqual([1, 2]);

		dispatcher.forgetMany([["firstEvent", listener1], ["secondEvent", listener2]]);

		await dispatcher.dispatch("firstEvent");
		await dispatcher.dispatch("secondEvent");

		expect(calls).toEqual([1, 2]);
	});
});

describe(".flush", () => {
	it("should remove all event listeners", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		dispatcher.listen("firstEvent", listener);

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1]);

		dispatcher.flush();

		await dispatcher.dispatch("firstEvent");

		expect(calls).toEqual([1]);
	});
});

describe(".getListeners", () => {
	it("should get all event listeners for an event", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		expect(dispatcher.getListeners("firstEvent")).toEqual([]);

		dispatcher.listen("firstEvent", listener);

		expect(dispatcher.getListeners("firstEvent")).toEqual([listener]);
	});
});

describe(".hasListeners", () => {
	it("should get all event listeners for an event", async () => {
		const calls: number[] = [];
		const listener = () => calls.push(1);

		expect(dispatcher.hasListeners("firstEvent")).toBeFalse();

		dispatcher.listen("firstEvent", listener);

		expect(dispatcher.hasListeners("firstEvent")).toBeTrue();
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

	describe("wildcard", () => {
		it("should match with a wildcard in the front", async () => {
			const calls: string[] = [];

			dispatcher.listen("user.created", () => calls.push("user.created"));
			dispatcher.listen("dashboard.created", () => calls.push("dashboard.created"));
			dispatcher.listen("manager.created", () => calls.push("manager.created"));

			await dispatcher.dispatch("*.created");

			expect(calls).toHaveLength(3);
		});

		it("should match with a wildcard in the back", async () => {
			const calls: string[] = [];

			dispatcher.listen("user.created", () => calls.push("user.created"));
			dispatcher.listen("user.deleted", () => calls.push("user.deleted"));

			await dispatcher.dispatch("user.*");

			expect(calls).toHaveLength(2);
		});

		it("should match with a wildcard in the middle", async () => {
			const calls: string[] = [];

			dispatcher.listen("user.manager.created", () => calls.push("user.manager.created"));
			dispatcher.listen("user.employee.created", () => calls.push("user.employee.created"));
			dispatcher.listen("user.friend.created", () => calls.push("user.friend.created"));

			await dispatcher.dispatch("user.*.created", { pos: "middle" });

			expect(calls).toHaveLength(3);
		});
	});
});

describe(".dispatchSeq", () => {
	it("should not execute an event listener without await (async behaviour)", () => {
		let unicorn: boolean = false;

		dispatcher.listen("firstEvent", () => (unicorn = true));

		dispatcher.dispatchSeq("firstEvent");

		expect(unicorn).toBeFalse();
	});

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

describe(".dispatchMany", () => {
	it("should emit many events", async () => {
		dispatcher.listen("firstEvent", (_, data) => expect(data).toEqual(true));
		dispatcher.listen("secondEvent", (_, data) => expect(data).toEqual(false));

		await dispatcher.dispatchMany([["firstEvent", true], ["secondEvent", false]]);
	});
});

describe(".dispatchManySeq", () => {
	it("should emit many events", async () => {
		dispatcher.listen("firstEvent", (_, data) => expect(data).toEqual(true));
		dispatcher.listen("secondEvent", (_, data) => expect(data).toEqual(false));

		await dispatcher.dispatchManySeq([["firstEvent", true], ["secondEvent", false]]);
	});
});

describe(".dispatchManySync", () => {
	it("should emit many events", () => {
		dispatcher.listen("firstEvent", (_, data) => expect(data).toEqual(true));
		dispatcher.listen("secondEvent", (_, data) => expect(data).toEqual(false));

		dispatcher.dispatchManySync([["firstEvent", true], ["secondEvent", false]]);
	});
});
