import type {PreparedNode} from '../../store/reducers/node/types';
import {cn} from '../../utils/cn';
import {LOAD_AVERAGE_TIME_INTERVALS} from '../../utils/constants';
import {InfoViewer} from '../InfoViewer/InfoViewer';
import type {InfoViewerItem} from '../InfoViewer/InfoViewer';
import {PoolUsage} from '../PoolUsage/PoolUsage';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {NodeUptime} from '../UptimeViewer/UptimeViewer';

import './FullNodeViewer.scss';

const b = cn('full-node-viewer');

interface FullNodeViewerProps {
    node: PreparedNode | undefined;
    className?: string;
}

export const FullNodeViewer = ({node, className}: FullNodeViewerProps) => {
    const endpointsInfo = node?.Endpoints?.map(({Name, Address}) => ({
        label: Name,
        value: Address,
    }));

    const commonInfo: InfoViewerItem[] = [];

    // Do not add DB field for static nodes (they have no Tenants)
    if (node?.Tenants?.length) {
        commonInfo.push({label: 'Database', value: node.Tenants[0]});
    }

    commonInfo.push(
        {label: 'Version', value: node?.Version},
        {
            label: 'Uptime',
            value: <NodeUptime StartTime={node?.StartTime} DisconnectTime={node?.DisconnectTime} />,
        },
        {label: 'DC', value: node?.DataCenterDescription || node?.DC},
        {label: 'Rack', value: node?.Rack},
    );

    const averageInfo = node?.LoadAveragePercents?.map((load, loadIndex) => ({
        label: LOAD_AVERAGE_TIME_INTERVALS[loadIndex],
        value: (
            <ProgressViewer value={load} percents={true} colorizeProgress={true} capacity={100} />
        ),
    }));

    return (
        <div className={`${b()} ${className}`}>
            {node ? (
                <div className={b('common-info')}>
                    <div>
                        <div className={b('section-title')}>Pools</div>
                        <div className={b('section', {pools: true})}>
                            {node?.PoolStats?.map((pool, poolIndex) => (
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

                    <InfoViewer title="Common info" className={b('section')} info={commonInfo} />

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
};
