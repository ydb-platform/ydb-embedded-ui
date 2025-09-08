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

const b = cn('entity-status');

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

// eslint-disable-next-line complexity
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
                    })}
                >
                    <span className={b('link', {'with-left-trim': withLeftTrim})} title={name}>
                        {renderLink()}
                    </span>
                    {(hasClipboardButton || infoPopoverContent) && (
                        <div
                            className={b('controls-wrapper', {
                                visible: clipboardButtonAlwaysVisible || infoIconHovered,
                            })}
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
