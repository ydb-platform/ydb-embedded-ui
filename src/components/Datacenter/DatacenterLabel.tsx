import {CircleQuestionFill} from '@gravity-ui/icons';
import type {LabelProps} from '@gravity-ui/uikit';
import {Icon, Label} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {
    getDatacenterColor,
    getDatacenterColorVariant,
    normalizeDatacenter,
} from '../../utils/datacenters';
import {useDatacenterColorIndexes} from '../../utils/hooks/useDatacenterColorIndexes';

import i18n from './i18n';

import './DatacenterLabel.scss';
import './datacenterColors.scss';

const b = cn('ydb-datacenter-label');
const colors = cn('ydb-datacenter-color');

export function DatacenterLabel({
    name,
    colorKey = name,
    count,
    size = 'xs',
}: {
    name?: string;
    colorKey?: string;
    count?: number;
    size?: LabelProps['size'];
}) {
    const indexes = useDatacenterColorIndexes();
    const normalized = normalizeDatacenter(name);
    const key = normalized ? colorKey : undefined;
    const text = normalized || i18n('value_unknown');
    const value = count === undefined ? undefined : i18n('value_nodes', {count});
    return (
        <Label
            size={size}
            theme="unknown"
            className={b(
                null,
                colors({
                    color: getDatacenterColor(key, indexes),
                    variant: getDatacenterColorVariant(key, indexes),
                }),
            )}
            icon={normalized ? undefined : <Icon data={CircleQuestionFill} size={10} />}
            value={value}
        >
            {text}
        </Label>
    );
}
