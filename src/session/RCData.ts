
export type RCData = {
    type: "INIT";
} | {
    type: "WINDOW_CLOSE";
    openTime: Date;
};
