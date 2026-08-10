import React from 'react';

import {CircleInfo} from '@gravity-ui/icons';
import {Button, ClipboardButton, Icon, Popover, Link as UIKitLink} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {YDB_POPOVER_CLASS_NAME} from '../../utils/constants';
import {InternalLink} from '../InternalLink/InternalLink';

import './EntityName.scss';

const b = cn('ydb-entity-name');

export interface EntityNameProps {
    name?: string;
    renderName?: (name?: string) => React.ReactNode;
    path?: string;
    externalLink?: boolean;
    withLeftTrim?: boolean;
    hasClipboardButton?: boolean;
    infoPopoverContent?: React.ReactNode;
    clipboardButtonAlwaysVisible?: boolean;
    leadingContent?: React.ReactNode;
    className?: string;
}

function defaultRenderName(name?: string) {
    return name ?? '';
}

export function EntityName({
    name = '',
    renderName = defaultRenderName,
    path,
    externalLink = false,
    withLeftTrim = false,
    hasClipboardButton,
    infoPopoverContent,
    clipboardButtonAlwaysVisible = false,
    leadingContent,
    className,
}: EntityNameProps) {
    const [infoIconHovered, setInfoIconHovered] = React.useState(false);

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
            {leadingContent ? <div className={b('leading-content')}>{leadingContent}</div> : null}
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
