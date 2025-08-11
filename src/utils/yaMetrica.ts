import {uiFactory} from '../uiFactory/uiFactory';

const yaMetricaId = uiFactory.yaMetricaId;

class FakeMetrica {
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
            console.warn('YaMetrica counter is not defined');
            this.warnShown = true;
        }
    }
}

export function getMetrica() {
    const metricaInstance = yaMetricaId && window[`yaCounter${yaMetricaId}`];

    return metricaInstance ?? new FakeMetrica();
}
