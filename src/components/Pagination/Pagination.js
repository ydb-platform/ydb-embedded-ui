import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {Button} from '@gravity-ui/uikit';
import Icon from '../Icon/Icon';
import Hotkey from '../Hotkey/Hotkey';

import './Pagination.scss';

const b = cn('elements-pagination');

const paginationControlComponent = PropTypes.shape({
    handler: PropTypes.func,
    disabled: PropTypes.bool,
    hotkey: PropTypes.string,
    hotkeyScope: PropTypes.string,
    hotkeyHandler: PropTypes.func,
    tooltip: PropTypes.string,
}).isRequired;

export default class Pagination extends React.Component {
    static propTypes = {
        previous: paginationControlComponent,
        next: paginationControlComponent,
    };

    renderComponent(name, control) {
        const hotkeySettings = [
            {
                keys: control.hotkey,
                scope: control.hotkeyScope,
                handler: control.hotkeyHandler,
            },
        ];

        return (
            <React.Fragment>
                <Button
                    view="outlined"
                    onClick={control.handler}
                    disabled={control.disabled}
                    title={control.tooltip}
                    className={b('control')}
                >
                    <Icon name={name} viewBox="0 0 6 11" width="6" height="11" />
                </Button>
                <Hotkey settings={hotkeySettings} />
            </React.Fragment>
        );
    }

    render() {
        const {previous, next} = this.props;

        return (
            <div className={b()}>
                {this.renderComponent('previous', previous)}
                <div className={b('divider')} />
                {this.renderComponent('next', next)}
            </div>
        );
    }
}
