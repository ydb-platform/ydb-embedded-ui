import type {TPoolStats} from '../../types/api/nodes';
import {cn} from '../../utils/cn';
import {PoolBar} from '../PoolBar/PoolBar';

import './PoolsGraph.scss';

const b = cn('ydb-pools-graph');

interface PoolsGraphProps {
    pools?: TPoolStats[];
}

export const PoolsGraph = ({pools = []}: PoolsGraphProps) => {
    return (
        <div className={b()}>
            {pools.map((item, index) => (
                <PoolBar key={index} data={item} />
            ))}
        </div>
    );
};
