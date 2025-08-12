import {uiFactory} from '../uiFactory/uiFactory';

export interface Counter {
    hit: (...args: unknown[]) => void;
    params: (...args: unknown[]) => void;
    userParams: (...args: unknown[]) => void;
    reachGoal: (...args: unknown[]) => void;
}

const yaMetricaMap = uiFactory.yaMetricaMap;

class FakeMetrica implements Counter {
    name: string;

    private warnShown = false;

    constructor(name: string) {
        this.name = name;
    }

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
            console.warn(`YaMetrica counter "${this.name}" is not defined\n`);
            this.warnShown = true;
        }
    }
}

export function getMetrica(name: string) {
    const yaMetricaId = yaMetricaMap?.[name];
    const metricaInstance = yaMetricaId
        ? (window[`yaCounter${yaMetricaId}`] as Counter)
        : undefined;

    return metricaInstance ?? new FakeMetrica(name);
}
