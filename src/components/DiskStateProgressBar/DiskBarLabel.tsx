import React from 'react';

import {cn} from '../../utils/cn';

const b = cn('storage-disk-progress-bar');

interface DiskBarLabelProps {
    children: React.ReactNode;
    variant?: 'percentage' | 'placeholder' | 'compact-placeholder';
}

export function DiskBarLabel({children, variant = 'percentage'}: DiskBarLabelProps) {
    return (
        <div
            className={b('title', {
                text: variant === 'placeholder',
                compact: variant === 'compact-placeholder',
            })}
        >
            {children}
        </div>
    );
}
