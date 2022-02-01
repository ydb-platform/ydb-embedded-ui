import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {Link} from 'react-router-dom';
import {ClipboardButton, Link as ExternalLink, Button} from '@yandex-cloud/uikit';

import './EntityStatus.scss';

const b = cn('entity-status');

class EntityStatus extends React.Component {
    static propTypes = {
        status: PropTypes.string,
        name: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        path: PropTypes.string,
        size: PropTypes.string,
        label: PropTypes.string,
        iconPath: PropTypes.string,
        hasClipboardButton: PropTypes.bool,
        showStatus: PropTypes.bool,
        externalLink: PropTypes.bool,
        className: PropTypes.string,
    };

    static defaultProps = {
        status: 'gray',
        text: '',
        size: 's',
        label: '',
        showStatus: true,
        externalLink: false,
    };
    renderIcon() {
        const {status, size, showStatus} = this.props;

        if (!showStatus) {
            return null;
        }

        return <div className={b('status-icon', {state: status.toLowerCase(), size})} />;
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
        const {externalLink, name, path} = this.props;

        if (externalLink) {
            return <ExternalLink href={path}>{name}</ExternalLink>;
        }

        return path ? (
            <Link title={name} to={path}>
                {name}
            </Link>
        ) : (
            name && (
                <span className={b('name')} title={name}>
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
                    <span
                        className={b('clipboard-button', {
                            visible: false,
                        })}
                    >
                        <Button size="s">
                            <ClipboardButton text={name} size={16} />
                        </Button>
                    </span>
                )}
            </div>
        );
    }
}

export default EntityStatus;
