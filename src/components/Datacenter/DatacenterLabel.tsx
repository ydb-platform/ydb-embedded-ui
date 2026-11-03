import {CircleQuestionFill} from '@gravity-ui/icons';
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

export function DatacenterLabel({name, colorKey = name}: {name?: string; colorKey?: string}) {
    const indexes = useDatacenterColorIndexes();
    const normalized = normalizeDatacenter(name);
    const key = normalized ? colorKey : undefined;
    const text = normalized || i18n('value_unknown');
    return (
        <Label
            size="xs"
            theme="unknown"
            className={b(
                null,
                colors({
                    color: getDatacenterColor(key, indexes),
                    variant: getDatacenterColorVariant(key, indexes),
                }),
            )}
            icon={normalized ? undefined : <Icon data={CircleQuestionFill} size={10} />}
        >
            {text}
        </Label>
    );
}
