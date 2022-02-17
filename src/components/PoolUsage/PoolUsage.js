import React from 'react';
import cn from 'bem-cn-lite';
import './PoolUsage.scss';
import PropTypes from 'prop-types';
const b = cn('pool-usage');

const formatUsage = (usage) => (typeof usage === 'undefined' ? '' : Math.floor(usage * 100));
const getLineType = (fillWidth) => {
    let fillColor = 'green';
    if (fillWidth > 60 && fillWidth <= 80) {
        fillColor = 'yellow';
    } else if (fillWidth > 80) {
        fillColor = 'red';
    }

    return fillColor;
};
export class PoolUsage extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    render() {
        const {data: pool = {}} = this.props;

        const {Threads, Name = 'Unknown', Usage} = pool;
        const dataExist = Usage && Threads;

        const value = formatUsage(pool.Usage);
        const fillWidth = value > 100 ? 100 : value;

        return (
            <div className={b()}>
                <div className={b('info')}>
                    <div className={b('pool-name')}>{Name}</div>
                    {dataExist && (
                        <div className={b('value')}>
                            <div className={b('percents')}>{value < 1 ? '<1' : value}%</div>
                            <div className={b('threads')}>(×{Threads})</div>
                        </div>
                    )}
                </div>
                <div className={b('visual')}>
                    <div
                        className={b('usage-line', {type: getLineType(fillWidth)})}
                        style={{width: `${fillWidth}%`}}
                    />
                </div>
            </div>
        );
    }
}

export default PoolUsage;
