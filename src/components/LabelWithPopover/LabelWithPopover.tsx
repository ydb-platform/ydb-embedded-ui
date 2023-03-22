import type {ReactNode} from 'react';

import {HelpPopover} from '@gravity-ui/uikit';

interface LabelWithPopoverProps {
    text: string;
    content: ReactNode;
    className?: string;
}

export const LabelWithPopover = ({text, content, className}: LabelWithPopoverProps) => (
    <div className={className}>
        {text}
        <HelpPopover content={content} />
    </div>
);
