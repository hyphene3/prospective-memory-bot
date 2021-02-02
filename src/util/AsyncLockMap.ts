import { AsyncLock } from "./AsyncLock";


export class AsyncLockMap {
    protected locks: { [id: string]: AsyncLock; } = {};

    public async acquire(id: string): Promise<void> {
        if (id in this.locks)
            await this.locks[id].acquire();
        else {
            let lock = new AsyncLock();
            this.locks[id] = lock;
            await lock.acquire();
        }
    }

    public releaseAll(id: string) {
        if (id in this.locks) {
            this.locks[id].releaseAll();
            delete this.locks[id];
        }
    }
}
