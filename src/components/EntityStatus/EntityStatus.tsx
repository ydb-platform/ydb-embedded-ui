import {ClipboardButton, Link as UIKitLink} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {InternalLink} from '../InternalLink/InternalLink';
import {StatusIcon} from '../StatusIcon/StatusIcon';
import type {StatusIconMode, StatusIconSize} from '../StatusIcon/StatusIcon';

import './EntityStatus.scss';

const b = cn('entity-status');

interface EntityStatusProps {
    status?: EFlag;
    name?: string;
    label?: string;
    path?: string;
    iconPath?: string;

    size?: StatusIconSize;
    mode?: StatusIconMode;

    showStatus?: boolean;
    externalLink?: boolean;
    withLeftTrim?: boolean;

    hasClipboardButton?: boolean;
    clipboardButtonAlwaysVisible?: boolean;

    className?: string;
}

export function EntityStatus({
    status = EFlag.Grey,
    name = '',
    label,
    path,
    iconPath,

    size = 's',
    mode = 'color',

    showStatus = true,
    externalLink = false,
    withLeftTrim = false,

    hasClipboardButton,
    clipboardButtonAlwaysVisible = false,

    className,
}: EntityStatusProps) {
    const renderIcon = () => {
        if (!showStatus) {
            return null;
        }

        return <StatusIcon className={b('icon')} status={status} size={size} mode={mode} />;
    };
    const renderStatusLink = (href: string) => {
        return (
            <UIKitLink target="_blank" href={href}>
                {renderIcon()}
            </UIKitLink>
        );
    };
    const renderLink = () => {
        if (path) {
            if (externalLink) {
                return (
                    <UIKitLink className={b('name')} href={path}>
                        {name}
                    </UIKitLink>
                );
            }

            return (
                <InternalLink className={b('name')} to={path}>
                    {name}
                </InternalLink>
            );
        }
        return name && <span className={b('name')}>{name}</span>;
    };
    return (
        <div className={b(null, className)}>
            {iconPath ? renderStatusLink(iconPath) : renderIcon()}
            {label && (
                <span title={label} className={b('label', {size, state: status.toLowerCase()})}>
                    {label}
                </span>
            )}
            {(path || name) && (
                <div className={b('wrapper', {'with-button': hasClipboardButton})}>
                    <span className={b('link', {'with-left-trim': withLeftTrim})} title={name}>
                        {renderLink()}
                    </span>
                    {hasClipboardButton && (
                        <div
                            className={b('controls-wrapper', {
                                visible: clipboardButtonAlwaysVisible,
                            })}
                        >
                            <ClipboardButton
                                text={name}
                                size="xs"
                                view="normal"
                                className={b('clipboard-button', {
                                    visible: clipboardButtonAlwaysVisible,
                                })}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
