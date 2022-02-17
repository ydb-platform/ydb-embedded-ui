import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';

import './PoolBar.scss';

const b = cn('pool-bar');

const getBarType = (usage) => {
    if (usage >= 75) {
        return 'danger';
    } else if (usage >= 50 && usage < 75) {
        return 'warning';
    } else {
        return 'normal';
    }
};

class PoolBar extends React.Component {
    static propTypes = {
        data: PropTypes.object,
        onMouseEnter: PropTypes.func,
        onMouseLeave: PropTypes.func,
    };

    bar = React.createRef();

    _onBarHover = () => {
        this.props.onMouseEnter(this.bar.current, this.props.data, 'pool');
    };
    _onBarLeave = () => {
        this.props.onMouseLeave();
    };
    render() {
        const {Usage: usage = 0} = this.props.data;
        const usagePercents = Math.min(usage * 100, 100);
        const type = getBarType(usagePercents);

        return (
            <div
                ref={this.bar}
                className={b({type})}
                onMouseEnter={this._onBarHover}
                onMouseLeave={this._onBarLeave}
            >
                <div style={{height: `${usagePercents}%`}} className={b('value', {type})} />
            </div>
        );
    }
}

export default PoolBar;
