import type {ReactNode} from 'react';

import {HelpPopover} from '@gravity-ui/components';

interface LabelWithPopoverProps {
    text: ReactNode;
    popoverContent: ReactNode;
    className?: string;
    contentClassName?: string;
}

export const LabelWithPopover = ({
    text,
    popoverContent,
    className,
    contentClassName,
}: LabelWithPopoverProps) => (
    <div className={className}>
        {text}
        {'\u00a0'}
        <HelpPopover content={popoverContent} contentClassName={contentClassName} />
    </div>
);
