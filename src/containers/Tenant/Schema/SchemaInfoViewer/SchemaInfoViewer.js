import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import './SchemaInfoViewer.scss';

import {formatCPU, formatBytes} from '../../../../utils';

import InfoViewer from '../../../../components/InfoViewer/InfoViewer';

const b = cn('schema-info-viewer');

class SchemaInfoViewer extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };
    formatTabletMetricsValue = (key, value) => {
        if (key === 'CPU') {
            return formatCPU(value);
        } else if (key === 'Memory' || key === 'Storage') {
            return formatBytes(value);
        } else {
            return value;
        }
    };
    render() {
        const {data} = this.props;

        if (data) {
            const {PathDescription = {}} = data;
            const {TableStats = {}, TabletMetrics = {}} = PathDescription;

            const tableStatsInfo = Object.keys(TableStats).map((key) => ({
                label: key,
                value: TableStats[key].toString(),
            }));

            const tabletMetricsInfo = Object.keys(TabletMetrics).map((key) => ({
                label: key,
                value: this.formatTabletMetricsValue(key, TabletMetrics[key].toString()),
            }));

            const generalInfo = [
                ...tabletMetricsInfo,
                ...tableStatsInfo,
            ];
 
            return (
                <div className={b()}>
                    <div className={b('item')}>
                        {generalInfo.length ? (
                            <InfoViewer info={generalInfo}></InfoViewer>
                        ) : (
                            <div>Empty</div>
                        )}
                    </div>
                </div>
            );
        } else {
            return <div className="error">no schema data</div>;
        }
    }
}

export default SchemaInfoViewer;
