import type {ButtonSize, ButtonView} from '@gravity-ui/uikit';
import {ClipboardButton as ClipboardButtonUikit} from '@gravity-ui/uikit';

import i18n from './i18n';

export interface ClipboardButtonProps {
    copyText?: string;
    withLabel?: boolean | string;
    size?: ButtonSize;
    view?: ButtonView;
    className?: string;
}

export function ClipboardButton({
    size,
    className,
    copyText,
    withLabel,
    view,
}: ClipboardButtonProps) {
    if (!copyText) {
        return null;
    }
    const label = withLabel === false ? null : withLabel || i18n('copy');

    return (
        <ClipboardButtonUikit view={view} size={size || 'xs'} className={className} text={copyText}>
            {label}
        </ClipboardButtonUikit>
    );
}
