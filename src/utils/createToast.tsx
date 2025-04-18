import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

export {toaster};

interface CreateToastProps {
    name?: string;
    title?: string;
    content?: string;
    type: 'error' | 'success';
    autoHiding?: number | false;
    className?: string;
}

function createToast({name, title, type, content, autoHiding, className}: CreateToastProps) {
    return toaster.add({
        name: name ?? 'Request succeeded',
        title: title ?? 'Request succeeded',
        theme: type === 'error' ? 'danger' : 'success',
        content: content,
        isClosable: true,
        autoHiding: autoHiding ?? (type === 'success' ? 5000 : false),
        className,
    });
}

export default createToast;
