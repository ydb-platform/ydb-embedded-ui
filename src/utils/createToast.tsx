import type {ToastProps} from '@gravity-ui/uikit';
import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

export {toaster};

function createToast({
    name,
    title = 'Request succeeded',
    theme = 'success',
    isClosable,
    autoHiding,
    ...restProps
}: ToastProps) {
    return toaster.add({
        name: name,
        title: title,
        theme: theme,
        isClosable: isClosable ?? true,
        autoHiding: autoHiding ?? (theme === 'success' ? 5000 : false),
        ...restProps,
    });
}

export default createToast;
