import React from 'react';

import {CircleInfo} from '@gravity-ui/icons';
import {Button, ClipboardButton, Icon, Popover, Link as UIKitLink} from '@gravity-ui/uikit';

import {EFlag} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {YDB_POPOVER_CLASS_NAME} from '../../utils/constants';
import {InternalLink} from '../InternalLink/InternalLink';
import {StatusIcon} from '../StatusIcon/StatusIcon';
import type {StatusIconMode, StatusIconSize} from '../StatusIcon/StatusIcon';

import './EntityStatus.scss';

const b = cn('ydb-entity-status');

export const EFlagToLabelTheme: Record<EFlag, LabelProps['theme']> = {
    [EFlag.Red]: 'danger',
    [EFlag.Blue]: 'success',
    [EFlag.Green]: 'success',
    [EFlag.Grey]: 'unknown',
    [EFlag.Orange]: 'danger',
    [EFlag.Yellow]: 'warning',
};

export const EFlagToStatusName: Record<EFlag, string> = {
    get [EFlag.Red]() {
        return i18n('title_red');
    },
    get [EFlag.Yellow]() {
        return i18n('title_yellow');
    },
    get [EFlag.Orange]() {
        return i18n('title_orange');
    },
    get [EFlag.Green]() {
        return i18n('title_green');
    },
    get [EFlag.Grey]() {
        return i18n('title_grey');
    },
    get [EFlag.Blue]() {
        return i18n('title_blue');
    },
};

interface EntityStatusLabelBaseProps {
    status: EFlag;
    className?: string;
    size?: LabelProps['size'];
    iconSize?: number;
    checkIcon?: React.ComponentProps<typeof StatusIcon>['checkIcon'];
    tooltipTitle?: string;
    qa?: string;
}

interface DefaultEntityStatusLabelProps {
    view?: 'default';
    note?: React.ReactNode;
    children?: React.ReactNode;
    endContent?: React.ReactNode;
    withStatusName?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    'aria-label'?: never;
    tabIndex?: never;
}

interface CompactEntityStatusLabelProps {
    view: 'compact';
    note?: never;
    children?: never;
    endContent?: never;
    withStatusName?: never;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    'aria-label'?: string;
    /** Tab index for a noninteractive tooltip anchor. Clickable labels use their button. */
    tabIndex?: number;
}

type EntityStatusLabelProps = EntityStatusLabelBaseProps &
    (DefaultEntityStatusLabelProps | CompactEntityStatusLabelProps);

function EntityStatusLabel({
    children,
    className,
    endContent,
    status,
    withStatusName = true,
    view = 'default',
    note,
    size = 'm',
    iconSize = 14,
    checkIcon,
    tooltipTitle,
    onClick,
    qa,
    'aria-label': ariaLabel,
    tabIndex,
}: EntityStatusLabelProps) {
    if (view === 'compact') {
        const statusName = EFlagToStatusName[status];
        const accessibleName = ariaLabel ?? statusName;
        const label = (
            <Label
                theme={status === EFlag.Blue ? 'info' : EFlagToLabelTheme[status]}
                icon={<StatusIcon size={iconSize} status={status} checkIcon={checkIcon} />}
                size={size}
                className={b(null, className)}
                interactive={Boolean(onClick)}
            />
        );
        return (
            <ActionTooltip title={tooltipTitle ?? statusName}>
                <span
                    className={b('compact')}
                    role={onClick ? undefined : 'img'}
                    aria-label={onClick ? undefined : accessibleName}
                    tabIndex={onClick ? undefined : tabIndex}
                    data-qa={qa}
                >
                    {onClick ? (
                        <button
                            type="button"
                            className={b('compact-button')}
                            onClick={onClick}
                            aria-label={accessibleName}
                        >
                            {label}
                        </button>
                    ) : (
                        label
                    )}
                </span>
            </ActionTooltip>
        );
    }
    const theme = EFlagToLabelTheme[status];
    const isClickable = Boolean(onClick);
    return (
        <ActionTooltip title={tooltipTitle ?? EFlagToDescription[status]} disabled={Boolean(note)}>
            <Label
                theme={theme}
                icon={<StatusIcon size={iconSize} status={status} checkIcon={checkIcon} />}
                size={size}
                className={b({critical: status === EFlag.Red, clickable: isClickable}, className)}
                onClick={onClick}
                interactive={isClickable}
                qa={qa}
            >
                <Flex gap="2" wrap="nowrap">
                    {children}
                    {withStatusName ? EFlagToStatusName[status] : null}
                    {endContent ? <Flex alignSelf="center">{endContent}</Flex> : null}
                    {note && <HelpMark className={b('note')}>{note}</HelpMark>}
                </Flex>
            </Label>
        </ActionTooltip>
    );
}

interface EntityStatusProps {
    status?: EFlag;
    name?: string;
    renderName?: (name?: string) => React.ReactNode;
    path?: string;

    size?: StatusIconSize;
    mode?: StatusIconMode;

    showStatus?: boolean;
    externalLink?: boolean;
    withLeftTrim?: boolean;

    hasClipboardButton?: boolean;
    infoPopoverContent?: React.ReactNode;
    clipboardButtonAlwaysVisible?: boolean;

    className?: string;
}

function defaultRenderName(name?: string) {
    return name ?? '';
}

export function EntityStatus({
    status = EFlag.Grey,
    name = '',
    renderName = defaultRenderName,
    path,

    size = 's',
    mode = 'color',

    showStatus = true,
    externalLink = false,
    withLeftTrim = false,

    hasClipboardButton,
    infoPopoverContent,
    clipboardButtonAlwaysVisible = false,

    className,
}: EntityStatusProps) {
    const [infoIconHovered, setInfoIconHovered] = React.useState(false);

    const renderIcon = () => {
        if (!showStatus) {
            return null;
        }

        return <StatusIcon className={b('icon')} status={status} size={size} mode={mode} />;
    };

    const renderLink = () => {
        if (path) {
            if (externalLink) {
                return (
                    <UIKitLink className={b('name')} href={path}>
                        {renderName(name)}
                    </UIKitLink>
                );
            }

            return (
                <InternalLink className={b('name')} to={path}>
                    {renderName(name)}
                </InternalLink>
            );
        }
        return name && <span className={b('name')}>{renderName(name)}</span>;
    };

    return (
        <div className={b(null, className)}>
            {renderIcon()}
            {(path || name) && (
                <div
                    className={b('wrapper', {
                        'with-clipboard-button': hasClipboardButton,
                        'with-info-button': Boolean(infoPopoverContent),
                        'with-link': Boolean(path),
                    })}
                >
                    <span
                        className={b('link', {
                            'with-left-trim': withLeftTrim,
                            'with-path': Boolean(path),
                        })}
                        title={name}
                    >
                        {renderLink()}
                    </span>
                    {(hasClipboardButton || infoPopoverContent) && (
                        <div
                            className={b('controls-wrapper', {
                                visible: clipboardButtonAlwaysVisible || infoIconHovered,
                            })}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {infoPopoverContent && (
                                <Popover
                                    className={YDB_POPOVER_CLASS_NAME}
                                    content={infoPopoverContent}
                                    placement={['top-start', 'bottom-start']}
                                    onOpenChange={(visible) => setInfoIconHovered(visible)}
                                >
                                    <Button
                                        view="normal"
                                        size="xs"
                                        className={b('info-icon', {
                                            visible:
                                                clipboardButtonAlwaysVisible || infoIconHovered,
                                        })}
                                    >
                                        <Icon data={CircleInfo} size="12" />
                                    </Button>
                                </Popover>
                            )}
                            {hasClipboardButton && (
                                <ClipboardButton
                                    text={name}
                                    size="xs"
                                    view="normal"
                                    className={b('clipboard-button', {
                                        visible: clipboardButtonAlwaysVisible || infoIconHovered,
                                    })}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
