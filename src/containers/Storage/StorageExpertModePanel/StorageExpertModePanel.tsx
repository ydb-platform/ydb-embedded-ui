import React from 'react';

import {cn} from '../../../utils/cn';

import './StorageExpertModePanel.scss';

const b = cn('ydb-storage-expert-mode-panel');

interface StorageExpertModePanelProps {
    className?: string;
    children?: React.ReactNode;
}

export function StorageExpertModePanel({className, children}: StorageExpertModePanelProps) {
    return <div className={b(null, className)}>{children}</div>;
}
