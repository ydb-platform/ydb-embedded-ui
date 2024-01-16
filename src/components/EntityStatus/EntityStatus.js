import {Icon, Link as UIKitLink} from '@gravity-ui/uikit';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import circleExclamationIcon from '../../assets/icons/circle-exclamation.svg';
import circleInfoIcon from '../../assets/icons/circle-info.svg';
import circleTimesIcon from '../../assets/icons/circle-xmark.svg';
import triangleExclamationIcon from '../../assets/icons/triangle-exclamation.svg';
import {ClipboardButton} from '../ClipboardButton';
import './EntityStatus.scss';

const icons = {
    BLUE: circleInfoIcon,
    YELLOW: circleExclamationIcon,
    ORANGE: triangleExclamationIcon,
    RED: circleTimesIcon,
};

const b = cn('entity-status');

class EntityStatus extends React.Component {
    static propTypes = {
        status: PropTypes.string,
        name: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        onNameMouseEnter: PropTypes.func,
        onNameMouseLeave: PropTypes.func,
        path: PropTypes.string,
        size: PropTypes.string,
        label: PropTypes.string,
        iconPath: PropTypes.string,
        hasClipboardButton: PropTypes.bool,
        clipboardButtonAlwaysVisible: PropTypes.bool,
        showStatus: PropTypes.bool,
        externalLink: PropTypes.bool,
        className: PropTypes.string,
        mode: PropTypes.oneOf(['color', 'icons']),
        withLeftTrim: PropTypes.bool,
    };

    static defaultProps = {
        status: 'gray',
        text: '',
        size: 's',
        label: '',
        showStatus: true,
        externalLink: false,
        mode: 'color',
        withLeftTrim: false,
        clipboardButtonAlwaysVisible: false,
    };
    renderIcon() {
        const {status, size, showStatus, mode} = this.props;

        if (!showStatus) {
            return null;
        }

        const modifiers = {state: status.toLowerCase(), size};

        if (mode === 'icons' && icons[status]) {
            return <Icon className={b('status-icon', modifiers)} data={icons[status]} />;
        }

        return <div className={b('status-color', modifiers)} />;
    }
    renderStatusLink() {
        const {iconPath} = this.props;

        return (
            <UIKitLink target="_blank" href={iconPath}>
                {this.renderIcon()}
            </UIKitLink>
        );
    }
    renderLink() {
        const {externalLink, name, path, onNameMouseEnter, onNameMouseLeave} = this.props;

        if (externalLink) {
            return (
                <UIKitLink className={b('name')} href={path}>
                    {name}
                </UIKitLink>
            );
        }

        return path ? (
            <Link
                className={b('name')}
                to={path}
                onMouseEnter={onNameMouseEnter}
                onMouseLeave={onNameMouseLeave}
            >
                {name}
            </Link>
        ) : (
            name && (
                <span
                    className={b('name')}
                    onMouseEnter={onNameMouseEnter}
                    onMouseLeave={onNameMouseLeave}
                >
                    {name}
                </span>
            )
        );
    }
    render() {
        const {name, label, iconPath, hasClipboardButton, className, size, status} = this.props;

        return (
            <div className={b(null, className)} title={name}>
                {iconPath ? this.renderStatusLink() : this.renderIcon()}
                {label && (
                    <span title={label} className={b('label', {size, state: status.toLowerCase()})}>
                        {label}
                    </span>
                )}
                <span className={b('link', {'with-left-trim': this.props.withLeftTrim})}>
                    {this.renderLink()}
                </span>
                {hasClipboardButton && (
                    <ClipboardButton
                        text={name}
                        size="s"
                        className={b('clipboard-button', {
                            visible: this.props.clipboardButtonAlwaysVisible,
                        })}
                    />
                )}
            </div>
        );
    }
}

export default EntityStatus;
