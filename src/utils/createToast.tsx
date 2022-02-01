import {Toaster} from '@yandex-cloud/uikit';

const toaster = new Toaster();

interface CreateToastProps {
    name?: string;
    title?: string;
    content?: string;
    type: 'error' | 'success';
}

function createToast({name, title, type, content}: CreateToastProps) {
    return toaster.createToast({
        name: name ?? 'Request succeeded',
        title: title ?? 'Request succeeded',
        type: type ?? 'success',
        content: content,
        isClosable: true,
        allowAutoHiding: type === 'success',
    });
}

export default createToast;
