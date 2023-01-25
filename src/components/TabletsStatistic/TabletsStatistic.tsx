import cn from 'bem-cn-lite';
import {Link} from 'react-router-dom';

import {getTabletLabel} from '../../utils/constants';
import {mapTabletStateToColorState} from '../../utils/tablet';
import routes, {createHref} from '../../routes';

import type {TTabletStateInfo as TFullTabletStateInfo} from '../../types/api/tablet';
import type {TTabletStateInfo as TComputeTabletStateInfo} from '../../types/api/compute';

import './TabletsStatistic.scss';

const b = cn('tablets-statistic');

type ITablets = TFullTabletStateInfo[] | TComputeTabletStateInfo[];

const prepareTablets = (tablets: ITablets) => {
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
    tablets: ITablets;
    path: string | undefined;
    nodeIds: string[] | number[];
}

export const TabletsStatistic = ({tablets = [], path, nodeIds}: TabletsStatisticProps) => {
    const renderTabletInfo = (item: ReturnType<typeof prepareTablets>[number], index: number) => {
        return (
            <Link
                to={createHref(routes.tabletsFilters, undefined, {
                    nodeIds,
                    state: item.state,
                    type: item.type,
                    path,
                })}
                key={index}
                className={b('tablet', {state: item.state?.toLowerCase()})}
            >
                {item.label}: {item.count}
            </Link>
        );
    };
    const preparedTablets = prepareTablets(tablets);

    return <div className={b()}>{preparedTablets.map(renderTabletInfo)}</div>;
};
