import cn from 'bem-cn-lite';
import {Link} from 'react-router-dom';

import {getTabletLabel} from '../../utils/constants';
import {mapTabletStateToColorState} from '../../utils/tablet';
import routes, {createHref} from '../../routes';

import type {TTabletStateInfo as TFullTabletStateInfo} from '../../types/api/tablet';
import type {TTabletStateInfo as TComputeTabletStateInfo} from '../../types/api/compute';

import './TabletsStatistic.scss';

const b = cn('tablets-statistic');

type Tablets = TFullTabletStateInfo[] | TComputeTabletStateInfo[];

const prepareTablets = (tablets: Tablets) => {
    const res = tablets.map((tablet) => {
        return {
            label: getTabletLabel(tablet.Type),
            type: tablet.Type,
            count: tablet.Count,
            state: mapTabletStateToColorState(tablet.State),
        };
    });

    return res.sort((x, y) => String(x.label).localeCompare(String(y.label)));
};

interface TabletsStatisticProps {
    tablets: Tablets;
    path: string | undefined;
    nodeIds: string[] | number[];
    backend?: string;
}

export const TabletsStatistic = ({tablets = [], path, nodeIds, backend}: TabletsStatisticProps) => {
    const renderTabletInfo = (item: ReturnType<typeof prepareTablets>[number], index: number) => {
        const tabletsPath = createHref(routes.tabletsFilters, undefined, {
            nodeIds,
            state: item.state,
            type: item.type,
            path,
            backend,
        });

        const label = `${item.label}: ${item.count}`;
        const className = b('tablet', {state: item.state?.toLowerCase()});

        return backend ? (
            <a href={tabletsPath} key={index} className={className}>
                {label}
            </a>
        ) : (
            <Link to={tabletsPath} key={index} className={className}>
                {label}
            </Link>
        );
    };
    const preparedTablets = prepareTablets(tablets);

    return <div className={b()}>{preparedTablets.map(renderTabletInfo)}</div>;
};
