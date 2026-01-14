import {formatNumber} from '../../../../../../utils/dataFormatters/dataFormatters';

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

    const countLabel = formatNumber(params.count);
    const belowLabel = formatNumber(params.belowMin);
    const aboveLabel = formatNumber(params.aboveMax);

    if (params.isBelowMin) {
        return i18n('tooltip_partitions-below-limit', {
            count: countLabel,
            diff: belowLabel,
            partitions,
        });
    }

    if (params.isAboveMax) {
        return i18n('tooltip_partitions-above-limit', {
            count: countLabel,
            diff: aboveLabel,
            partitions,
        });
    }

    return i18n('tooltip_partitions-current', {
        count: countLabel,
        partitions,
    });
}
