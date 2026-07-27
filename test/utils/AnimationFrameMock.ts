import { vi } from "vitest";

type GlobalPropertyName = "requestAnimationFrame" | "cancelAnimationFrame";
type GlobalPropertyDescriptor = PropertyDescriptor | undefined;

export class AnimationFrameMock {
    #requestAnimationFrameDescriptor: GlobalPropertyDescriptor = undefined;
    #cancelAnimationFrameDescriptor: GlobalPropertyDescriptor = undefined;
    #installed: boolean = false;
    #nextId: number = 1;
    #callbacks: Map<number, FrameRequestCallback> = new Map();

    #requestAnimationFrame = (callback: FrameRequestCallback): number => {
        const id = this.#nextId++;

        this.#callbacks.set(id, callback);

        return id;
    };

    #cancelAnimationFrame = (id: number): void => {
        this.#callbacks.delete(id);
    };

    #assertInstalled(): void {
        if (!this.#installed) {
            throw new Error("AnimationFrameMock is not installed.");
        }
    }

    #resetState(): void {
        this.#nextId = 1;
        this.#callbacks.clear();
    }

    #restoreGlobalProperty(name: GlobalPropertyName, descriptor: GlobalPropertyDescriptor): void {
        if (descriptor === undefined) {
            Reflect.deleteProperty(globalThis, name);
        } else {
            Object.defineProperty(globalThis, name, descriptor);
        }
    }

    public install(): void {
        if (this.#installed) {
            throw new Error("AnimationFrameMock is already installed.");
        }

        const requestAnimationFrameDescriptor = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame");
        const cancelAnimationFrameDescriptor = Object.getOwnPropertyDescriptor(globalThis, "cancelAnimationFrame");

        try {
            Object.defineProperty(globalThis, "requestAnimationFrame", {
                value: vi.fn(this.#requestAnimationFrame),
                writable: true,
                configurable: true,
            });

            Object.defineProperty(globalThis, "cancelAnimationFrame", {
                value: vi.fn(this.#cancelAnimationFrame),
                writable: true,
                configurable: true,
            });
        } catch (error) {
            this.#restoreGlobalProperty("requestAnimationFrame", requestAnimationFrameDescriptor);
            this.#restoreGlobalProperty("cancelAnimationFrame", cancelAnimationFrameDescriptor);

            throw error;
        }

        this.#requestAnimationFrameDescriptor = requestAnimationFrameDescriptor;
        this.#cancelAnimationFrameDescriptor = cancelAnimationFrameDescriptor;
        this.#installed = true;
    }

    public reset(): void {
        this.#assertInstalled();
        this.#resetState();

        vi.mocked(requestAnimationFrame).mockClear();
        vi.mocked(cancelAnimationFrame).mockClear();
    }

    public uninstall(): void {
        if (!this.#installed) {
            return;
        }

        this.#resetState();
        this.#restoreGlobalProperty("requestAnimationFrame", this.#requestAnimationFrameDescriptor);
        this.#restoreGlobalProperty("cancelAnimationFrame", this.#cancelAnimationFrameDescriptor);

        this.#requestAnimationFrameDescriptor = undefined;
        this.#cancelAnimationFrameDescriptor = undefined;
        this.#installed = false;
    }

    public dispatch(timestamp: DOMHighResTimeStamp): void {
        this.#assertInstalled();

        const callbackIds = [...this.#callbacks.keys()];

        for (const callbackId of callbackIds) {
            const callback = this.#callbacks.get(callbackId);

            if (callback === undefined) {
                continue;
            }

            this.#callbacks.delete(callbackId);
            callback(timestamp);
        }
    }

    public pendingRequestCount(): number {
        this.#assertInstalled();

        return this.#callbacks.size;
    }
}
