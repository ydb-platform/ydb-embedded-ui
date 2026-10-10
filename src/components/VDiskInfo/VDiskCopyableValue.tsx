import type React from 'react';

import {ClipboardButton, Flex} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import {vDiskInfoKeyset} from './i18n';

import './VDiskCopyableValue.scss';

const b = cn('ydb-vdisk-copyable-value');

interface VDiskCopyableValueProps {
    children: React.ReactNode;
    copyText?: string | null;
    fieldName: string;
}

export function VDiskCopyableValue({children, copyText, fieldName}: VDiskCopyableValueProps) {
    return (
        <Flex inline alignItems="center" className={b({'with-copy': Boolean(copyText)})}>
            {children}
            {copyText && (
                <ClipboardButton
                    className={b('button')}
                    text={copyText}
                    size="s"
                    view="flat-secondary"
                    aria-label={vDiskInfoKeyset('action_copy-field', {field: fieldName})}
                />
            )}
        </Flex>
    );
}
