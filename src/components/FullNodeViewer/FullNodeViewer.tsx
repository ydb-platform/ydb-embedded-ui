import {Flex} from '@gravity-ui/uikit';

import type {PreparedNode} from '../../store/reducers/node/types';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatStorageValues} from '../../utils/dataFormatters/dataFormatters';
import {useNodeDeveloperUIHref} from '../../utils/hooks/useNodeDeveloperUIHref';
import {getNodeMemory} from '../../utils/memory';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {PoolUsage} from '../PoolUsage/PoolUsage';
import {ProgressViewer} from '../ProgressViewer/ProgressViewer';
import {NodeUptime} from '../UptimeViewer/UptimeViewer';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

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

const formatMemoryValues = (value?: number, total?: number) =>
    formatStorageValues(value, total, 'gb', undefined, true);

// eslint-disable-next-line complexity
export const FullNodeViewer = ({node, className}: FullNodeViewerProps) => {
    const developerUIHref = useNodeDeveloperUIHref(node);

    const commonInfo: YDBDefinitionListItem[] = [];

    if (node?.Tenants?.length) {
        commonInfo.push({
            name: i18n('database'),
            content: node.Tenants[0] || EMPTY_DATA_PLACEHOLDER,
        });
    }

    commonInfo.push(
        {name: i18n('version'), content: node?.Version || EMPTY_DATA_PLACEHOLDER},
        {
            name: i18n('uptime'),
            content: (
                <NodeUptime StartTime={node?.StartTime} DisconnectTime={node?.DisconnectTime} />
            ),
        },
        {
            name: i18n('dc'),
            content: node?.DataCenterDescription || node?.DC || EMPTY_DATA_PLACEHOLDER,
        },
    );

    if (node?.Rack) {
        commonInfo.push({name: i18n('rack'), content: node.Rack});
    }

    if (developerUIHref) {
        commonInfo.push({
            name: i18n('links'),
            content: <LinkWithIcon url={developerUIHref} title={i18n('developer-ui')} />,
        });
    }

    const endpointsInfo = node?.Endpoints?.map(({Name, Address}) => ({
        name: Name || EMPTY_DATA_PLACEHOLDER,
        content: Address || EMPTY_DATA_PLACEHOLDER,
    }));

    const averageInfo =
        node?.LoadAveragePercents?.map((load, loadIndex) => ({
            name: getLoadAverageIntervalTitle(loadIndex),
            content: (
                <ProgressViewer
                    value={load}
                    percents={true}
                    colorizeProgress={true}
                    capacity={100}
                />
            ),
        })) ?? [];

    if (!node) {
        return <div className="error">{i18n('no-data')}</div>;
    }

    const {memoryUsed, memoryLimit} = getNodeMemory(node);

    const renderMemory = () => {
        if (memoryUsed === undefined) {
            return EMPTY_DATA_PLACEHOLDER;
        }
        if (memoryLimit === undefined) {
            return formatMemoryValues(memoryUsed)[0];
        }

        return (
            <ProgressViewer
                value={memoryUsed}
                capacity={memoryLimit}
                formatValues={formatMemoryValues}
                colorizeProgress
            />
        );
    };

    return (
        <div className={b(null, className)}>
            <Flex wrap gap={4}>
                <Flex direction="column" gap={2}>
                    <div className={b('section')}>
                        <div className={b('section-title')}>{i18n('title.common-info')}</div>
                        <YDBDefinitionList items={commonInfo} nameMaxWidth={100} compact />
                    </div>

                    {endpointsInfo && endpointsInfo.length ? (
                        <div className={b('section')}>
                            <div className={b('section-title')}>{i18n('title.endpoints')}</div>
                            <YDBDefinitionList items={endpointsInfo} nameMaxWidth={100} compact />
                        </div>
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

                    <div className={b('section', {average: true})}>
                        <div className={b('section-title')}>{i18n('title.load-average')}</div>
                        <YDBDefinitionList items={averageInfo} nameMaxWidth={100} compact />
                    </div>

                    <div className={b('section', {ram: true})} data-qa="node-ram">
                        <div className={b('section-title')}>{i18n('title_ram')}</div>
                        {renderMemory()}
                    </div>
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
