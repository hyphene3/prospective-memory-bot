import { CancellableEventHandler } from "./CancellableEventHandler";


export class CancellableEvent<T> {
    private callback: () => void;
    public readonly date: Date;
    public readonly data: T;
    private done: boolean = false;

    public constructor(eventHandler: CancellableEventHandler<T>, date: Date, data: T) {
        this.callback = () => eventHandler.onEvent(data);
        setTimeout(() => {
            this.callback();
            this.done = true;
        }, (date.valueOf() - Date.now()));
        this.date = date;
        this.data = data;
    }

    public isDone() {
        return this.done;
    }

    public cancel() {
        this.callback = () => { };
    }
}
