import { afterEach, describe, expect, it, vi } from "vitest";
import { cadenceSubscriptionSpies, destroyStarfields } from "./utils/StarfieldTestContext.js";

afterEach(() => {
    destroyStarfields();
    vi.restoreAllMocks();
});

describe("cadence subscription", () => {
    describe("constructor", () => {
        it("does not subscribe or unsubscribe when constructed", () => {
            const {
                spies: { subscribeSpy, unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            expect(subscribeSpy).not.toHaveBeenCalled();
            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("callback", () => {
        it("unsubscribes the subscribed callback when stopped", () => {
            const {
                starfield,
                spies: { subscribeSpy, unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });

        it("unsubscribes the subscribed callback when paused", () => {
            const {
                starfield,
                spies: { subscribeSpy, unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });

        it("unsubscribes the subscribed callback when destroyed", () => {
            const {
                starfield,
                spies: { subscribeSpy, unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            const callback = subscribeSpy.mock.calls[0]![0];

            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledWith(callback);
        });
    });

    describe("stop", () => {
        it("does not unsubscribe when stopped while already stopped", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when stopped while running", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when stopped while paused", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when stopped while destroyed", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.stop();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("start", () => {
        it("subscribes when started while stopped", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not subscribe when started while already running", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.start();

            expect(subscribeSpy).not.toHaveBeenCalled();
        });

        it("subscribes when started while paused", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not subscribe when started while destroyed", () => {
            const {
                starfield,
                spies: { subscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();

            expect(subscribeSpy).toHaveBeenCalledTimes(1);

            subscribeSpy.mockClear();

            starfield.destroy();

            expect(() => starfield.start()).toThrow();
            expect(subscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("pause", () => {
        it("does not unsubscribe when paused while stopped", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when paused while running", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when paused while already paused", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when paused while destroyed", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.pause();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });

    describe("destroy", () => {
        it("does not unsubscribe when destroyed while stopped", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("unsubscribes when destroyed while running", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it("does not unsubscribe when destroyed while paused", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.pause();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });

        it("does not unsubscribe when destroyed while already destroyed", () => {
            const {
                starfield,
                spies: { unsubscribeSpy },
            } = cadenceSubscriptionSpies();

            starfield.start();
            starfield.destroy();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

            unsubscribeSpy.mockClear();

            starfield.destroy();

            expect(unsubscribeSpy).not.toHaveBeenCalled();
        });
    });
});
