import {configuredNumeral} from '../numeral';
import i18n from './i18n';

export const formatCPU = (value?: number) => {
    if (value === undefined) {
        return undefined;
    }

    const rawCores = value / 1000000;
    let cores = rawCores.toPrecision(3);
    if (rawCores >= 1000) {
        cores = rawCores.toFixed();
    }
    if (rawCores < 0.001) {
        cores = '0';
    }
    const localizedCores = configuredNumeral(Number(cores)).format('0.[000]');

    return `${localizedCores} ${i18n('cores', {count: cores})}`;
};
