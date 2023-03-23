import type {ReactNode} from 'react';

import {HelpPopover} from '@gravity-ui/uikit';

interface LabelWithPopoverProps {
    text: string;
    popoverContent: ReactNode;
    className?: string;
}

export const LabelWithPopover = ({text, popoverContent, className}: LabelWithPopoverProps) => (
    <div className={className}>
        {text}
        <HelpPopover content={popoverContent} />
    </div>
);
