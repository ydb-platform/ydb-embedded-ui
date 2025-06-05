import type {ToastProps} from '@gravity-ui/uikit';
import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

export {toaster};

function createToast({name, title, theme, isClosable, autoHiding, ...restProps}: ToastProps) {
    return toaster.add({
        name: name ?? 'Request succeeded',
        title: title ?? 'Request succeeded',
        theme: theme ?? 'success',
        isClosable: isClosable ?? true,
        autoHiding: autoHiding ?? (theme === 'success' ? 5000 : false),
        ...restProps,
    });
}

export default createToast;
