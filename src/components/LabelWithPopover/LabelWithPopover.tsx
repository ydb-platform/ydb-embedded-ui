import {HelpPopover} from '@gravity-ui/components';
import type {ButtonProps} from '@gravity-ui/uikit';

interface LabelWithPopoverProps {
    text: React.ReactNode;
    popoverContent: React.ReactNode;
    popoverClassName?: string;
    className?: string;
    contentClassName?: string;
    buttonProps?: ButtonProps;
}

export const LabelWithPopover = ({
    text,
    popoverContent,
    popoverClassName,
    className,
    contentClassName,
    buttonProps,
}: LabelWithPopoverProps) => (
    <div className={className}>
        {text}
        {'\u00a0'}
        <HelpPopover
            className={popoverClassName}
            buttonProps={buttonProps}
            content={popoverContent}
            contentClassName={contentClassName}
        />
    </div>
);
