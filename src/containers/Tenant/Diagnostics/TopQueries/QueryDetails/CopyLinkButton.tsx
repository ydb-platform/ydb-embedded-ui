import React from 'react';

import {Link} from '@gravity-ui/icons';
import type {ButtonProps, CopyToClipboardStatus} from '@gravity-ui/uikit';
import {ActionTooltip, Button, CopyToClipboard, Icon} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import './QueryDetails.scss';

const b = cn('kv-query-details');

interface LinkButtonComponentProps extends ButtonProps {
    size?: ButtonProps['size'];
    hasTooltip?: boolean;
    status: CopyToClipboardStatus;
    closeDelay?: number;
}

const DEFAULT_TIMEOUT = 1200;
const TOOLTIP_ANIMATION = 200;

const LinkButtonComponent = (props: LinkButtonComponentProps) => {
    const {size = 'm', hasTooltip = true, status, closeDelay, ...rest} = props;

    return (
        <ActionTooltip
            title={
                status === 'success'
                    ? i18n('query-details.link-copied')
                    : i18n('query-details.copy-link')
            }
            disabled={!hasTooltip}
            closeDelay={closeDelay}
        >
            <Button view="flat-secondary" size={size} {...rest}>
                <Button.Icon className={b('icon')}>
                    <Icon data={Link} size={16} />
                </Button.Icon>
            </Button>
        </ActionTooltip>
    );
};

export interface CopyLinkButtonProps extends ButtonProps {
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
