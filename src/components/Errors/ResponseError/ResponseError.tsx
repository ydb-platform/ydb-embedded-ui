import {prepareErrorMessage} from '../../../utils/prepareErrorMessage';
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
    const message = prepareErrorMessage(error) || defaultMessage;

    return <div className={`error ${className || ''}`}>{message}</div>;
};
