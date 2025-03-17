import {FileText} from '@gravity-ui/icons';
import type {ButtonSize} from '@gravity-ui/uikit';
import {Button, Icon} from '@gravity-ui/uikit';

interface LogsButtonProps {
    className?: string;
    href: string;
    size?: ButtonSize;
}

export function LogsButton({href, className, size = 'xs'}: LogsButtonProps) {
    return (
        <Button href={href} target="_blank" className={className} size={size} title="Database logs">
            <Icon data={FileText} />
        </Button>
    );
}
