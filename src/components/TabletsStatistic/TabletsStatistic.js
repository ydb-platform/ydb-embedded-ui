import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';

import {getTabletLabel} from '../../utils/constants';
import routes, {createHref} from '../../routes';

import './TabletsStatistic.scss';

const b = cn('tablets-statistic');

const prepareTablets = (tablets) => {
    const res = tablets.map((tablet) => {
        return {
            label: getTabletLabel(tablet.Type),
            type: tablet.Type,
            count: tablet.Count,
            state: tablet.State,
        };
    });

    return res.sort((a, b) => a.label.localeCompare(b.label));
};

class TabletStatistic extends React.Component {
    static propTypes = {
        tablets: PropTypes.array,
        path: PropTypes.string,
        nodeIds: PropTypes.array,
    };
    renderTabletInfo = (item, index) => {
        const {path, nodeIds} = this.props;

        return (
            <Link
                to={createHref(routes.tabletsFilters, null, {
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
    render() {
        const {tablets = []} = this.props;
        const preparedTablets = prepareTablets(tablets);

        return <div className={b()}>{preparedTablets.map(this.renderTabletInfo)}</div>;
    }
}

export default TabletStatistic;
