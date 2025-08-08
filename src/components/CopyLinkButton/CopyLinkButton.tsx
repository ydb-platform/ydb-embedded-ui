import React from 'react';

import {Link} from '@gravity-ui/icons';
import type {ButtonButtonProps, CopyToClipboardStatus} from '@gravity-ui/uikit';
import {ActionTooltip, Button, CopyToClipboard, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import i18n from './i18n';

import './CopyLinkButton.scss';

const b = cn('ydb-copy-link-button');

interface LinkButtonComponentProps extends ButtonButtonProps {
    hasTooltip?: boolean;
    status: CopyToClipboardStatus;
    closeDelay?: number;
    title?: string;
}

const DEFAULT_TIMEOUT = 1200;
const TOOLTIP_ANIMATION = 200;

const LinkButtonComponent = (props: LinkButtonComponentProps) => {
    const {size = 'm', hasTooltip = true, status, closeDelay, title, ...rest} = props;

    const baseTitle = title ?? i18n('description_copy');

    return (
        <ActionTooltip
            title={status === 'success' ? i18n('description_copied') : baseTitle}
            disabled={!hasTooltip}
            closeDelay={closeDelay}
        >
            <Button view="flat" size={size} {...rest}>
                <Button.Icon className={b('icon')}>
                    <Icon data={Link} size={16} />
                </Button.Icon>
            </Button>
        </ActionTooltip>
    );
};

export interface CopyLinkButtonProps extends ButtonButtonProps {
    text: string;
}

export function CopyLinkButton(props: CopyLinkButtonProps) {
    const {text, ...buttonProps} = props;

    const timerIdRef = React.useRef<number>();
    const [tooltipCloseDelay, setTooltipCloseDelay] = React.useState<number | undefined>(undefined);
    const [tooltipDisabled, setTooltipDisabled] = React.useState(false);
    const timeout = DEFAULT_TIMEOUT;

    React.useEffect(() => window.clearTimeout(timerIdRef.current), []);

    const handleCopy = React.useCallback(() => {
        setTooltipDisabled(false);
        setTooltipCloseDelay(timeout);

        window.clearTimeout(timerIdRef.current);

        timerIdRef.current = window.setTimeout(() => {
            setTooltipDisabled(true);
        }, timeout - TOOLTIP_ANIMATION);
    }, [timeout]);

    return (
        <CopyToClipboard text={text} timeout={timeout} onCopy={handleCopy}>
            {(status) => (
                <LinkButtonComponent
                    {...buttonProps}
                    closeDelay={tooltipCloseDelay}
                    hasTooltip={!tooltipDisabled}
                    status={status}
                />
            )}
        </CopyToClipboard>
    );
}
