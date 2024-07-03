import i18n from '../i18n';

interface ResponseErrorProps {
    error?: unknown;
    className?: string;
    defaultMessage?: string;
}

export const ResponseError = ({
    error,
    className,
    defaultMessage = i18n('responseError.defaultMessage'),
}: ResponseErrorProps) => {
    let statusText = '';

    if (error && typeof error === 'string') {
        statusText = error;
    }
    if (error && typeof error === 'object') {
        if ('data' in error && typeof error.data === 'string') {
            statusText = error.data;
        } else if ('statusText' in error && typeof error.statusText === 'string') {
            statusText = error.statusText;
        } else if ('message' in error && typeof error.message === 'string') {
            statusText = error.message;
        }
    }
    return <div className={`error ${className}`}>{statusText || defaultMessage}</div>;
};
