import {Link} from 'react-router-dom';
import cn from 'bem-cn-lite';

import {Link as UIKitLink} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import {StatusIcon, type StatusIconMode, type StatusIconSize} from '../StatusIcon/StatusIcon';
import {ClipboardButton} from '../ClipboardButton';
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

        return <StatusIcon status={status} size={size} mode={mode} />;
    };
    const renderStatusLink = () => {
        return (
            <UIKitLink target="_blank" href={iconPath}>
                {renderIcon()}
            </UIKitLink>
        );
    };
    const renderLink = () => {
        if (externalLink) {
            return (
                <UIKitLink className={b('name')} href={path}>
                    {name}
                </UIKitLink>
            );
        }

        return path ? (
            <Link className={b('name')} to={path}>
                {name}
            </Link>
        ) : (
            name && <span className={b('name')}>{name}</span>
        );
    };
    return (
        <div className={b(null, className)} title={name}>
            {iconPath ? renderStatusLink() : renderIcon()}
            {label && (
                <span title={label} className={b('label', {size, state: status.toLowerCase()})}>
                    {label}
                </span>
            )}
            <span className={b('link', {'with-left-trim': withLeftTrim})}>{renderLink()}</span>
            {hasClipboardButton && (
                <ClipboardButton
                    text={name}
                    size="s"
                    className={b('clipboard-button', {
                        visible: clipboardButtonAlwaysVisible,
                    })}
                />
            )}
        </div>
    );
}
