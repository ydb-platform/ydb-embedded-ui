import {formatToMs, parseUsToMs} from '../../utils/timeParsers';

export function preparePingTimeValue(value: string | number) {
    return formatToMs(parseUsToMs(value, 1));
}

export function prepareClockSkewValue(value: string | number) {
    const valueMs = parseUsToMs(value, 1);
    // Add + sign to positive values, do not add + to values that displayed as 0
    const sign = Number(valueMs) <= 0 ? '' : '+';

    return sign + formatToMs(valueMs);
}
