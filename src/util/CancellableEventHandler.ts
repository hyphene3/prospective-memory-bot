
export interface CancellableEventHandler<T> {
    onEvent(data: T): void;
}
