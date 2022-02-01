export class AutoFetcher {
    constructor() {
        this.timeout = AutoFetcher.DEFAULT_TIMEOUT;
        this.active = true;
        this.timer = undefined;
    }

    wait(ms: number) {
        return new Promise((resolve) => {
            this.timer = setTimeout(resolve, ms);
            return;
        });
    }
    async fetch(request: Function) {
        if (!this.active) {
            return;
        }

        await this.wait(this.timeout);

        if (this.active) {
            const startTs = Date.now();
            await request();
            const finishTs = Date.now();

            const responseTime = finishTs - startTs;
            const nextTimeout =
                responseTime > AutoFetcher.MIN_TIMEOUT ? responseTime : AutoFetcher.MIN_TIMEOUT;
            this.timeout = nextTimeout;

            this.fetch(request);
        } else {
            return;
        }
    }
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.active = false;
    }
    start() {
        this.active = true;
    }

    static DEFAULT_TIMEOUT = 30000;
    static MIN_TIMEOUT = 30000;
    timeout: number;
    active: boolean;
    timer: undefined | ReturnType<typeof setTimeout>;
}
