import {Toaster} from '@gravity-ui/uikit';

const toaster = new Toaster();

interface CreateToastProps {
    name?: string;
    title?: string;
    content?: string;
    type: 'error' | 'success';
}

function createToast({name, title, type, content}: CreateToastProps) {
    return toaster.add({
        name: name ?? 'Request succeeded',
        title: title ?? 'Request succeeded',
        type: type ?? 'success',
        content: content,
        isClosable: true,
        autoHiding: type === 'success' ? 5000 : false,
    });
}

export default createToast;
