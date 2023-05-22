import cn from 'bem-cn-lite';
import JSONTree from 'react-json-inspector';

import {NodeEndpointsTooltipContent, TabletTooltipContent} from '../components/TooltipsContent';

const poolB = cn('pool-tooltip');

const PoolTooltip = (props) => {
    const {data} = props;
    const usage = (data.Usage * 100).toFixed(2);
    return (
        data && (
            <div className={poolB()}>
                <table>
                    <tbody>
                        <tr>
                            <td className={poolB('label')}>Pool</td>
                            <td>{data.Name}</td>
                        </tr>
                        <tr>
                            <td className={poolB('label')}>Usage</td>
                            <td>{usage} %</td>
                        </tr>
                        <tr>
                            <td className={poolB('label')}>Threads</td>
                            <td>{data.Threads}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    );
};

const nodeB = cn('node-tootltip');

const NodeTooltip = (props) => {
    const {data} = props;
    return (
        data && (
            <div className={nodeB()}>
                <table>
                    <tbody>
                        <tr>
                            <td className={nodeB('label')}>ID</td>
                            <td className={nodeB('value')}>{data.nodeId || '?'}</td>
                        </tr>
                        <tr>
                            <td className={nodeB('label')}>Rack</td>
                            <td className={nodeB('value')}>{data.rack || '?'}</td>
                        </tr>
                        {data.connected && data.capacity && (
                            <tr>
                                <td className={nodeB('label')}>Net</td>
                                <td className={nodeB('value')}>
                                    {`${data.connected} / ${data.capacity}`}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )
    );
};

const tabletsOverallB = cn('tabletsOverall-tooltip');

const TabletsOverallTooltip = (props) => {
    const {data} = props;
    return (
        data && (
            <div className={tabletsOverallB()}>
                <table>
                    <tbody>
                        {data.map((colorInfo, key) => {
                            return (
                                <tr key={key}>
                                    <td className={tabletsOverallB('label')}>{colorInfo.color}:</td>
                                    <td className={tabletsOverallB('value')}>
                                        {`${colorInfo.value}/${
                                            colorInfo.total
                                        } (${colorInfo.percents.toFixed(2)}%)`}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )
    );
};

const histogramB = cn('histogram-tooltip');

const HistogramTooltip = (props) => {
    const {data} = props;
    return (
        data && (
            <div className={histogramB()}>
                <table>
                    <tbody>
                        <tr>
                            <td className={histogramB('label')}>Count</td>
                            <td className={histogramB('value')}>{data.count || '?'}</td>
                        </tr>
                        <tr>
                            <td className={histogramB('label')}>From</td>
                            <td className={histogramB('value')}>{data.leftBound || '?'}</td>
                        </tr>
                        <tr>
                            <td className={histogramB('label')}>To</td>
                            <td className={histogramB('value')}>{data.rightBound || '?'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    );
};

const cellB = cn('cell-tooltip');
const jsonB = cn('json-tooltip');

export const tooltipTemplates = {
    // eslint-disable-next-line react/display-name
    pool: (data) => <PoolTooltip data={data} />,
    // eslint-disable-next-line react/display-name
    tablet: (data) => <TabletTooltipContent data={data} />,
    // eslint-disable-next-line react/display-name
    node: (data) => <NodeTooltip data={data} />,
    nodeEndpoints: (data) => <NodeEndpointsTooltipContent data={data} />,
    // eslint-disable-next-line react/display-name
    tabletsOverall: (data) => <TabletsOverallTooltip data={data} />,
    // eslint-disable-next-line react/display-name
    histogram: (data) => <HistogramTooltip data={data} />,
    // eslint-disable-next-line react/display-name
    cell: (data) => <div className={cellB()}>{data}</div>,
    // eslint-disable-next-line react/display-name
    json: (data) => {
        return (
            <div className={jsonB()}>
                <JSONTree
                    data={data}
                    search={false}
                    isExpanded={() => true}
                    className={jsonB('inspector')}
                />
            </div>
        );
    },
};
