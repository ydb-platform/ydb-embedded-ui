import React from 'react';

import {cn} from '../../utils/cn';

import './InfoViewerTitle.scss';

const b = cn('ydb-info-viewer-title');

export function InfoViewerTitle({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={b(null, className)}>{children}</div>;
}
