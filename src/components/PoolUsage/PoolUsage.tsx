import block from 'bem-cn-lite';

import type {TPoolStats} from '../../types/api/nodes';

import './PoolUsage.scss';

const b = block('ydb-pool-usage');

const getLineType = (fillWidth: number) => {
    let fillColor = 'green';
    if (fillWidth > 60 && fillWidth <= 80) {
        fillColor = 'yellow';
    } else if (fillWidth > 80) {
        fillColor = 'red';
    }

    return fillColor;
};

interface PoolUsageProps {
    data?: TPoolStats;
}

export const PoolUsage = ({data: pool = {}}: PoolUsageProps) => {
    const {Threads, Name = 'Unknown', Usage = 0} = pool;
    const dataExist = Usage && Threads;

    const value = Math.floor(Usage * 100);
    const fillWidth = value > 100 ? 100 : value;

    return (
        <div className={b()}>
            <div className={b('info')}>
                <div className={b('pool-name')}>{Name}</div>
                {dataExist && (
                    <div className={b('value')}>
                        <div className={b('percents')}>{value < 1 ? '<1' : value}%</div>
                        <div className={b('threads')}>(×{Threads})</div>
                    </div>
                )}
            </div>
            <div className={b('visual')}>
                <div
                    className={b('usage-line', {type: getLineType(fillWidth)})}
                    style={{width: `${fillWidth}%`}}
                />
            </div>
        </div>
    );
};
