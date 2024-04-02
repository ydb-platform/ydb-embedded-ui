import type {TPoolStats} from '../../types/api/nodes';
import {cn} from '../../utils/cn';
import {ContentWithPopup} from '../ContentWithPopup/ContentWithPopup';
import {PoolTooltipContent} from '../TooltipsContent';

import './PoolBar.scss';

const b = cn('ydb-pool-bar');

const getBarType = (usage: number) => {
    if (usage >= 75) {
        return 'danger';
    } else if (usage >= 50 && usage < 75) {
        return 'warning';
    } else {
        return 'normal';
    }
};

interface PoolBarProps {
    data?: TPoolStats;
}

export const PoolBar = ({data = {}}: PoolBarProps) => {
    const {Usage: usage = 0} = data;
    const usagePercents = Math.min(usage * 100, 100);
    const type = getBarType(usagePercents);

    return (
        <ContentWithPopup
            className={b({type})}
            content={<PoolTooltipContent data={data} className={b('popup-content')} />}
        >
            <div style={{height: `${usagePercents}%`}} className={b('value', {type})} />
        </ContentWithPopup>
    );
};
