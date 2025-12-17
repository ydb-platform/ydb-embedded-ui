import i18n from './i18n';

export const getPartitionsNoun = (count: number) =>
    count === 1 ? i18n('value_partition-one') : i18n('value_partition-many');

export function getPartitionsTooltip(params: {
    count: number;
    belowMin: number;
    aboveMax: number;
    isBelowMin: boolean;
    isAboveMax: boolean;
}) {
    const partitions = getPartitionsNoun(params.count);

    if (params.isBelowMin) {
        return i18n('tooltip_partitions-below-limit', {
            count: params.count,
            diff: params.belowMin,
            partitions,
        });
    }

    if (params.isAboveMax) {
        return i18n('tooltip_partitions-above-limit', {
            count: params.count,
            diff: params.aboveMax,
            partitions,
        });
    }

    return i18n('tooltip_partitions-current', {
        count: params.count,
        partitions,
    });
}
