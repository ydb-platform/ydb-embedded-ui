import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {formatNumber} from '../../utils';
import './TabletsViewer.scss';

import {TABLET_STATES} from '../../utils/constants';

const b = cn('tablets-viewer');

const prepareStates = (states) => {
    return states.map((state) => {
        return {
            label: TABLET_STATES[state.VolatileState],
            count: formatNumber(state.Count),
        };
    });
};

class TabletsViewer extends React.Component {
    static propTypes = {
        tablets: PropTypes.array,
    };
    renderTabletInfo = (item, index) => {
        return (
            <div key={index} className={b('row')}>
                <div className={b('tablet-label')}>{item.label}</div>
                <span>{item.count}</span>
            </div>
        );
    };
    render() {
        const {tablets = []} = this.props;
        const preparedStates = prepareStates(tablets);

        return (
            <div className={b()}>
                <div className={b('grid')}>{preparedStates.map(this.renderTabletInfo)}</div>
            </div>
        );
    }
}

export default TabletsViewer;
