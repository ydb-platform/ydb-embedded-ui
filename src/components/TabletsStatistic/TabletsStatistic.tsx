import {Link} from 'react-router-dom';

import {TABLETS} from '../../containers/Node/NodePages';
import routes, {createHref} from '../../routes';
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
    path: string | undefined;
    nodeId: string | number;
    backend?: string;
}

export const TabletsStatistic = ({tablets = [], path, nodeId, backend}: TabletsStatisticProps) => {
    const renderTabletInfo = (item: ReturnType<typeof prepareTablets>[number], index: number) => {
        const tabletsPath = createHref(
            routes.node,
            {id: nodeId, activeTab: TABLETS},
            {
                tenantName: path,
                backend,
            },
        );

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
