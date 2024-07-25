import {Alert} from '@gravity-ui/uikit';

interface BannerProps {
    message?: React.ReactNode;
    title?: string;
    className?: string;
    onClose?: () => void;
}

export function Banner({message, title, className, onClose}: BannerProps) {
    return (
        <Alert
            className={className}
            theme="info"
            title={title}
            message={message}
            onClose={onClose}
        />
    );
}
