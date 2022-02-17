import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import InternalLink from '../InternalLink/InternalLink';

import {getTabletLabel} from '../../utils/constants';
import routes, {createHref} from '../../routes';

import './Tablet.scss';

const b = cn('tablet');

class Tablet extends React.PureComponent {
    static propTypes = {
        className: PropTypes.string,
        tablet: PropTypes.object,
        onMouseEnter: PropTypes.func,
        onMouseLeave: PropTypes.func,
    };
    static defaultProps = {
        onMouseEnter: () => {},
        onMouseLeave: () => {},
    };
    ref = React.createRef();
    _onTabletMouseEnter = () => {
        const {tablet} = this.props;
        this.props.onMouseEnter(this.ref.current, tablet, 'tablet');
    };
    _onTabletClick = () => {
        const {tablet = {}} = this.props;
        const {TabletId: id} = tablet;

        if (id) {
            this.props.onMouseLeave();
        }
    };
    render() {
        const {tablet = {}} = this.props;
        const {TabletId: id} = tablet;
        const status = tablet.Overall?.toLowerCase();

        return (
            <InternalLink
                onClick={this._onTabletClick}
                to={id && createHref(routes.tablet, {id})}
                className={b('wrapper')}
            >
                <div
                    ref={this.ref}
                    className={b({status})}
                    onMouseEnter={this._onTabletMouseEnter}
                    onMouseLeave={this.props.onMouseLeave}
                >
                    <div className={b('type')}>{[getTabletLabel(tablet.Type)]}</div>
                </div>
            </InternalLink>
        );
    }
}
export default Tablet;
