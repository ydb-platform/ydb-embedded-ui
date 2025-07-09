import {HelpMark} from '@gravity-ui/uikit';

interface LabelWithPopoverProps {
    text: React.ReactNode;
    popoverContent: React.ReactNode;
    popoverClassName?: string;
    className?: string;
}

export const LabelWithPopover = ({
    text,
    popoverContent,
    popoverClassName,
    className,
}: LabelWithPopoverProps) => (
    <div className={className}>
        {text}
        {'\u00a0'}
        <HelpMark className={popoverClassName}>{popoverContent}</HelpMark>
    </div>
);
