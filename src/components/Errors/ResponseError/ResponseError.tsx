import type {IResponseError} from '../../../types/api/error';
import i18n from '../i18n';

interface ResponseErrorProps {
    error?: IResponseError;
    className?: string;
    defaultMessage?: string;
}

export const ResponseError = ({
    error,
    className,
    defaultMessage = i18n('responseError.defaultMessage'),
}: ResponseErrorProps) => {
    return <div className={`error ${className}`}>{error?.statusText || defaultMessage}</div>;
};
