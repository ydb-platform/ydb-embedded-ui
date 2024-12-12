import {TabletTooltipContent} from '../components/TooltipsContent';

import {cn} from './cn';

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
                        {data.connected && data.capacity ? (
                            <tr>
                                <td className={nodeB('label')}>Net</td>
                                <td className={nodeB('value')}>
                                    {`${data.connected} / ${data.capacity}`}
                                </td>
                            </tr>
                        ) : null}
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

export const tooltipTemplates = {
    tablet: (data) => <TabletTooltipContent data={data} />,
    node: (data) => <NodeTooltip data={data} />,
    histogram: (data) => <HistogramTooltip data={data} />,
    cell: (data) => <div className={cellB()}>{data}</div>,
};
