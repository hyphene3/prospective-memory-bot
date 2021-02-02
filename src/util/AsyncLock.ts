
export class AsyncLock {
    private callbackFuncQueue: Array<() => void> = [];
    private locked = false;

    async acquire(): Promise<void> {
        if (!this.locked) {
            this.locked = true;
            return;
        }
        return new Promise((resolve, reject) => {
            this.callbackFuncQueue.push(() => {
                resolve();
            });
        });
    }

    releaseAll() {
        this.locked = false;
        while (this.callbackFuncQueue.length > 0) {
            let callback = this.callbackFuncQueue.shift();
            if (callback)
                callback();
        }
    }

}
