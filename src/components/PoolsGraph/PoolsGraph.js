import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import PoolBar from '../PoolBar/PoolBar';

import './PoolsGraph.scss';

const b = cn('pools-graph');

class PoolsGraph extends React.Component {
    static propTypes = {
        pools: PropTypes.arrayOf(PropTypes.object).isRequired,
        onMouseLeave: PropTypes.func,
        onMouseEnter: PropTypes.func,
    };
    static defaultProps = {
        pools: [],
    };
    render() {
        const {pools} = this.props;

        return (
            <div className={b()}>
                {pools.map((item, index) => (
                    <PoolBar key={index} data={item} {...this.props} />
                ))}
            </div>
        );
    }
}

export default PoolsGraph;
