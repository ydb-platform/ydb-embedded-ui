import {Link} from 'react-router-dom';

import {getDefaultNodePath} from '../../routes';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {cn} from '../../utils/cn';
import {getTabletLabel} from '../../utils/constants';
import {mapTabletStateToColorState} from '../../utils/tablet';

import './TabletsStatistic.scss';

const b = cn('tablets-statistic');

const prepareTablets = (tablets: TTabletStateInfo[]) => {
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
    tablets: TTabletStateInfo[];
    database: string | undefined;
    nodeId: string | number;
}

export const TabletsStatistic = ({tablets = [], database, nodeId}: TabletsStatisticProps) => {
    const renderTabletInfo = (item: ReturnType<typeof prepareTablets>[number], index: number) => {
        const tabletsPath = getDefaultNodePath({id: nodeId, activeTab: 'tablets'}, {database});

        const label = `${item.label}: ${item.count}`;
        const className = b('tablet', {state: item.state?.toLowerCase()});

        return (
            <Link to={tabletsPath} key={index} className={className}>
                {label}
            </Link>
        );
    };
    const preparedTablets = prepareTablets(tablets);

    return <div className={b()}>{preparedTablets.map(renderTabletInfo)}</div>;
};
