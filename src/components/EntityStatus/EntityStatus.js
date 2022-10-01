import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {Link} from 'react-router-dom';
import {ClipboardButton, Link as ExternalLink, Button, Icon} from '@gravity-ui/uikit';

import circleInfoIcon from '../../assets/icons/circle-info.svg';
import circleExclamationIcon from '../../assets/icons/circle-exclamation.svg';
import triangleExclamationIcon from '../../assets/icons/triangle-exclamation.svg';
import circleTimesIcon from '../../assets/icons/circle-xmark.svg';

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
        showStatus: PropTypes.bool,
        externalLink: PropTypes.bool,
        className: PropTypes.string,
        mode: PropTypes.oneOf(['color', 'icons']),
    };

    static defaultProps = {
        status: 'gray',
        text: '',
        size: 's',
        label: '',
        showStatus: true,
        externalLink: false,
        mode: 'color',
    };
    renderIcon() {
        const {status, size, showStatus, mode} = this.props;

        if (!showStatus) {
            return null;
        }

        const modifiers = {state: status.toLowerCase(), size};

        if (mode === 'icons' && icons[status]) {
            return (
                <Icon
                    className={b('status-icon', modifiers)}
                    data={icons[status]}
                />
            );
        }

        return <div className={b('status-color', modifiers)} />;
    }
    renderStatusLink() {
        const {iconPath} = this.props;

        return (
            <ExternalLink target="_blank" href={iconPath}>
                {this.renderIcon()}
            </ExternalLink>
        );
    }
    renderLink() {
        const {externalLink, name, path, onNameMouseEnter, onNameMouseLeave} = this.props;

        if (externalLink) {
            return <ExternalLink href={path}>{name}</ExternalLink>;
        }

        return path ? (
            <Link
                title={name}
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
                    title={name}
                    onMouseEnter={onNameMouseEnter}
                    onMouseLeave={onNameMouseLeave}
                >
                    {name}
                </span>
            )
        );
    }
    render() {
        const {name, label, iconPath, hasClipboardButton, className} = this.props;

        return (
            <div className={b(null, className)}>
                {iconPath ? this.renderStatusLink() : this.renderIcon()}
                {label && (
                    <span title={label} className={b('label')}>
                        {label}
                    </span>
                )}
                {this.renderLink()}
                {hasClipboardButton && (
                    <Button
                        component="span"
                        size="s"
                        className={b('clipboard-button', {
                            visible: false,
                        })}
                    >
                        <ClipboardButton text={name} size={16} />
                    </Button>
                )}
            </div>
        );
    }
}

export default EntityStatus;
