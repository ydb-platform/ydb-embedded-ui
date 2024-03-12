import {Link} from 'react-router-dom';
import cn from 'bem-cn-lite';

import {Icon, Link as UIKitLink} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import circleExclamationIcon from '../../assets/icons/circle-exclamation.svg';
import circleInfoIcon from '../../assets/icons/circle-info.svg';
import circleTimesIcon from '../../assets/icons/circle-xmark.svg';
import triangleExclamationIcon from '../../assets/icons/triangle-exclamation.svg';
import {ClipboardButton} from '../ClipboardButton';
import './EntityStatus.scss';

const icons = {
    [EFlag.Blue]: circleInfoIcon,
    [EFlag.Yellow]: circleExclamationIcon,
    [EFlag.Orange]: triangleExclamationIcon,
    [EFlag.Red]: circleTimesIcon,
};

const b = cn('entity-status');

interface EntityStatusProps {
    status?: EFlag;
    name?: string;
    label?: string;
    path?: string;
    iconPath?: string;

    size?: 'xs' | 's' | 'm' | 'l';
    mode?: 'color' | 'icons';

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

        const modifiers = {state: status.toLowerCase(), size};

        if (mode === 'icons' && status in icons) {
            return (
                <Icon
                    className={b('status-icon', modifiers)}
                    data={icons[status as keyof typeof icons]}
                />
            );
        }

        return <div className={b('status-color', modifiers)} />;
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
