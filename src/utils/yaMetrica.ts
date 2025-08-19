import {uiFactory} from '../uiFactory/uiFactory';

/**
 * Interface for a counter that provides methods for tracking metrics.
 * @function hit - Tracks a hit event with optional arguments. https://yandex.ru/support/metrica/ru/objects/hit
 * @function params - Sets parameters for the counter with optional arguments. https://yandex.ru/support/metrica/ru/objects/params-method
 * @function userParams - Sets user-specific parameters for the counter with optional arguments. https://yandex.ru/support/metrica/ru/objects/user-params
 * @function reachGoal - Tracks a goal achievement event with optional arguments. https://yandex.ru/support/metrica/ru/objects/reachgoal
 */
export interface Counter {
    hit: (...args: unknown[]) => void;
    params: (...args: unknown[]) => void;
    userParams: (...args: unknown[]) => void;
    reachGoal: (...args: unknown[]) => void;
}

const yaMetricaMap = uiFactory.yaMetricaMap;

/**
 * A fake implementation of a counter metric for Yandex.Metrica.
 * This class is used when the actual Yandex.Metrica counter is not defined,
 * and it provides a warning message the first time any of its methods are called.
 * @property name - The name of the counter.
 * @property warnShown - Flag to indicate if the warning has been shown.
 */
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
            console.warn(`Yandex.Metrica counter "${this.name}" is not defined\n`);
            this.warnShown = true;
        }
    }
}

/**
 * Retrieves a Yandex Metrica instance by name from the global window object.
 * If no instance is found for the given name, returns a FakeMetrica instance instead.
 * @param name The name of the metrica to retrieve
 * @returns The Yandex Metrica instance if found, otherwise a FakeMetrica instance
 */
export function getMetrica(name: string) {
    const yaMetricaId = yaMetricaMap?.[name];
    const metricaInstance = yaMetricaId
        ? (window[`yaCounter${yaMetricaId}`] as Counter)
        : undefined;

    return metricaInstance ?? new FakeMetrica(name);
}
