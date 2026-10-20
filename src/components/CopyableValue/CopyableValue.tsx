import type React from 'react';

import {ClipboardButton, Flex} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import i18n from './i18n';

import './CopyableValue.scss';

const b = cn('ydb-copyable-value');

interface CopyableValueProps {
    children: React.ReactNode;
    copyText?: string | null;
    fieldName: string;
    copyButtonLabel?: string;
}

export function CopyableValue({
    children,
    copyText,
    fieldName,
    copyButtonLabel,
}: CopyableValueProps) {
    return (
        <Flex inline alignItems="center" className={b({'with-copy': Boolean(copyText)})}>
            {children}
            {copyText && (
                <ClipboardButton
                    className={b('button')}
                    text={copyText}
                    size="s"
                    view="flat-secondary"
                    aria-label={copyButtonLabel ?? i18n('action_copy-field', {field: fieldName})}
                />
            )}
        </Flex>
    );
}
