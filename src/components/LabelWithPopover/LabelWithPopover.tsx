import type {ReactNode} from 'react';

import {HelpPopover} from '@gravity-ui/uikit';

interface LabelWithPopoverProps {
    headerText: string;
    popoverContent: ReactNode;
    className?: string;
}

export const LabelWithPopover = ({
    headerText,
    popoverContent,
    className,
}: LabelWithPopoverProps) => (
    <div className={className}>
        {headerText}
        <HelpPopover content={popoverContent} />
    </div>
);
