import {Button, CopyToClipboard as CopyToClipboardUiKit} from '@gravity-ui/uikit';
import createToast from '../../utils/createToast';
//@ts-ignore
import Icon from '../Icon/Icon';

interface CopyToClipboardProps {
    text: string;
    title?: string;
    disabled?: boolean;
    toastText?: string;
}

function CopyToClipboard(props: CopyToClipboardProps) {
    return (
        <CopyToClipboardUiKit text={props.text} timeout={1000}>
            {(state) => {
                if (state === 'success') {
                    createToast({
                        name: 'Copied',
                        title: props.toastText ?? 'Data was copied to clipboard successfully',
                        type: state,
                    });
                }

                return (
                    <Button
                        disabled={props.disabled}
                        title={props.title ?? 'Copy'}
                        view="flat-secondary"
                    >
                        <Icon name="copy" viewBox={'0 0 16 16'} width={16} height={16} />
                    </Button>
                );
            }}
        </CopyToClipboardUiKit>
    );
}

export default CopyToClipboard;
