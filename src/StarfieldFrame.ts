export type StarfieldFrame = {
    readonly timestamp: DOMHighResTimeStamp;
    readonly delta: DOMHighResTimeStamp;
    readonly elapsed: DOMHighResTimeStamp;
    readonly frame: number;
};

export type StarfieldFrameCallback = (starfieldFrame: StarfieldFrame) => void;
