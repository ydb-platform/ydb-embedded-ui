import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';

import InfoViewer from '../InfoViewer/InfoViewer';
import ProgressViewer from '../ProgressViewer/ProgressViewer';
import PoolUsage from '../PoolUsage/PoolUsage';

import {LOAD_AVERAGE_TIME_INTERVALS} from '../../utils/constants';
import {calcUptime} from '../../utils';

import './FullNodeViewer.scss';

const b = cn('full-node-viewer');

class FullNodeViewer extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        node: PropTypes.object.isRequired,
        backend: PropTypes.string,
        singleClusterMode: PropTypes.bool,
    };

    static defaultProps = {
        className: '',
    };

    render() {
        const {node, className} = this.props;

        const endpointsInfo = node.Endpoints?.map(({Name, Address}) => ({
            label: Name,
            value: Address,
        }));

        const commonInfo = [
            {label: 'Version', value: node.Version},
            {label: 'Uptime', value: calcUptime(node.StartTime)},
            {label: 'DC', value: node.DataCenterDescription},
            {label: 'Rack', value: node.Rack},
        ];

        const averageInfo = node.LoadAverage.map((load, loadIndex) => ({
            label: LOAD_AVERAGE_TIME_INTERVALS[`${loadIndex}`],
            value: <ProgressViewer value={load} percents={true} colorizeProgress={true} />,
        }));

        return (
            <div className={`${b()} ${className}`}>
                {node ? (
                    <div className={b('common-info')}>
                        <div>
                            <div className={b('section-title')}>Pools</div>
                            <div className={b('section', {pools: true})}>
                                {node.PoolStats.map((pool, poolIndex) => (
                                    <PoolUsage key={poolIndex} data={pool} />
                                ))}
                            </div>
                        </div>

                        {endpointsInfo && endpointsInfo.length && (
                            <InfoViewer
                                title="Endpoints"
                                className={b('section')}
                                info={endpointsInfo}
                            />
                        )}

                        <InfoViewer
                            title="Common info"
                            className={b('section')}
                            info={commonInfo}
                        />

                        <InfoViewer
                            title="Load average"
                            className={b('section', {average: true})}
                            info={averageInfo}
                        />
                    </div>
                ) : (
                    <div className="error">no data</div>
                )}
            </div>
        );
    }
}

export default FullNodeViewer;
