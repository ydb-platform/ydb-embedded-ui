import {
    Button,
    ButtonProps,
    ClipboardIcon,
    CopyToClipboard as CopyToClipboardUiKit,
    CopyToClipboardStatus,
    Tooltip,
} from '@gravity-ui/uikit';
import cn from 'bem-cn-lite';

const b = cn('clipboard-button');

interface ClipboardButtonProps extends Pick<ButtonProps, 'disabled' | 'size' | 'title' | 'view'> {
    className?: string;
    text: string;
}

/**
 * An inner component required
 * because `react-copy-to-clipboard` doesn't work with `Tooltip` otherwise.
 */
function InnerButton({
    className,
    status,
    title,
    ...props
}: Omit<ClipboardButtonProps, 'text'> & {status: CopyToClipboardStatus}) {
    return (
        <Tooltip content={status === CopyToClipboardStatus.Success ? 'Copied!' : title || 'Copy'}>
            <Button {...props} className={b(null, className)}>
                <Button.Icon>
                    <ClipboardIcon status={status} size={16} />
                </Button.Icon>
            </Button>
        </Tooltip>
    );
}

export function ClipboardButton({text, ...props}: ClipboardButtonProps) {
    return (
        <CopyToClipboardUiKit text={text} timeout={1000}>
            {(status) => <InnerButton {...props} status={status} />}
        </CopyToClipboardUiKit>
    );
}
