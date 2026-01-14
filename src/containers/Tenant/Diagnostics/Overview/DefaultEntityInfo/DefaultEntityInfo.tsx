import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {cn} from '../../../../../utils/cn';
import {EntityTitle} from '../../../EntityTitle/EntityTitle';

import './DefaultEntityInfo.scss';

export const b = cn('default-entity-info');

interface DefaultEntityInfoProps {
    data?: TEvDescribeSchemeResult;
}

export function DefaultEntityInfo({data}: DefaultEntityInfoProps) {
    return (
        <div className={b('title')}>
            <EntityTitle data={data?.PathDescription} />
        </div>
    );
}
