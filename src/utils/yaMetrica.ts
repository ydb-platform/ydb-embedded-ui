import {uiFactory} from '../uiFactory/uiFactory';

export interface Counter {
    hit: (...args: unknown[]) => void;
    params: (...args: unknown[]) => void;
    userParams: (...args: unknown[]) => void;
    reachGoal: (...args: unknown[]) => void;
}

const yaMetricaId = uiFactory.yaMetricaId;

class FakeMetrica implements Counter {
    private warnShown = false;

    hit() {
        this.warnOnce();
    }

    params() {
        this.warnOnce();
    }

    userParams() {
        this.warnOnce();
    }

    reachGoal() {
        this.warnOnce();
    }

    private warnOnce() {
        if (!this.warnShown) {
            console.warn('YaMetrica counter is not defined\n');
            this.warnShown = true;
        }
    }
}

export function getMetrica() {
    const metricaInstance = yaMetricaId
        ? (window[`yaCounter${yaMetricaId}`] as Counter)
        : undefined;

    return metricaInstance ?? new FakeMetrica();
}
