import {Flex} from '@gravity-ui/uikit';

import type {PreparedNode} from '../../store/reducers/node/types';
import {cn} from '../../utils/cn';
import {useNodeDeveloperUIHref} from '../../utils/hooks/useNodeDeveloperUIHref';
import {InfoViewer} from '../InfoViewer/InfoViewer';
import type {InfoViewerItem} from '../InfoViewer/InfoViewer';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {PoolUsage} from '../PoolUsage/PoolUsage';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {NodeUptime} from '../UptimeViewer/UptimeViewer';

import i18n from './i18n';

import './FullNodeViewer.scss';

const b = cn('full-node-viewer');

interface FullNodeViewerProps {
    node?: PreparedNode;
    className?: string;
}
const getLoadAverageIntervalTitle = (index: number) => {
    return [i18n('la-interval-1m'), i18n('la-interval-5m'), i18n('la-interval-15m')][index];
};

export const FullNodeViewer = ({node, className}: FullNodeViewerProps) => {
    const developerUIHref = useNodeDeveloperUIHref(node);

    const commonInfo: InfoViewerItem[] = [];

    if (node?.Tenants?.length) {
        commonInfo.push({label: i18n('database'), value: node.Tenants[0]});
    }

    commonInfo.push(
        {label: i18n('version'), value: node?.Version},
        {
            label: i18n('uptime'),
            value: <NodeUptime StartTime={node?.StartTime} DisconnectTime={node?.DisconnectTime} />,
        },
        {label: i18n('dc'), value: node?.DataCenterDescription || node?.DC},
    );

    if (node?.Rack) {
        commonInfo.push({label: i18n('rack'), value: node?.Rack});
    }

    if (developerUIHref) {
        commonInfo.push({
            label: i18n('links'),
            value: <LinkWithIcon url={developerUIHref} title={i18n('developer-ui')} />,
        });
    }

    const endpointsInfo = node?.Endpoints?.map(({Name, Address}) => ({
        label: Name,
        value: Address,
    }));

    const averageInfo = node?.LoadAveragePercents?.map((load, loadIndex) => ({
        label: getLoadAverageIntervalTitle(loadIndex),
        value: (
            <ProgressViewer value={load} percents={true} colorizeProgress={true} capacity={100} />
        ),
    }));

    if (!node) {
        return <div className="error">{i18n('no-data')}</div>;
    }

    return (
        <div className={b(null, className)}>
            <Flex wrap gap={4}>
                <Flex direction="column" gap={2}>
                    <InfoViewer
                        title={i18n('title.common-info')}
                        className={b('section')}
                        info={commonInfo}
                    />

                    {endpointsInfo && endpointsInfo.length ? (
                        <InfoViewer
                            title={i18n('title.endpoints')}
                            className={b('section')}
                            info={endpointsInfo}
                        />
                    ) : null}
                </Flex>

                <Flex direction="column" gap={2}>
                    <div>
                        <div className={b('section-title')}>{i18n('title.pools')}</div>
                        <div className={b('section', {pools: true})}>
                            {node?.PoolStats?.map((pool, poolIndex) => (
                                <PoolUsage key={poolIndex} data={pool} />
                            ))}
                        </div>
                    </div>

                    <InfoViewer
                        title={i18n('title.load-average')}
                        className={b('section', {average: true})}
                        info={averageInfo}
                    />
                </Flex>

                {node.Roles && node.Roles.length ? (
                    <Flex direction="column" gap={2}>
                        <div className={b('section')}>
                            <div className={b('section-title')}>{i18n('title.roles')}</div>
                            {node?.Roles?.map((role) => (
                                <div className={b('role')} key={role}>
                                    {role}
                                </div>
                            ))}
                        </div>
                    </Flex>
                ) : null}
            </Flex>
        </div>
    );
};
