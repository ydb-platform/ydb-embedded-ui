import {Button, Disclosure} from '@gravity-ui/uikit';
import {ErrorBoundary as ErrorBoundaryBase} from 'react-error-boundary';

import {cn} from '../../utils/cn';
import {registerError} from '../../utils/registerError';
import {useComponent} from '../ComponentsProvider/ComponentsProvider';
import {Illustration} from '../Illustration';

import i18n from './i18n';

import './ErrorBoundary.scss';

const b = cn('ydb-error-boundary');

export function ErrorBoundary({children}: {children?: React.ReactNode}) {
    const ErrorBoundaryComponent = useComponent('ErrorBoundary');
    return <ErrorBoundaryComponent>{children}</ErrorBoundaryComponent>;
}

interface ErrorBoundaryProps {
    children?: React.ReactNode;
    useRetry?: boolean;
    onReportProblem?: (error?: Error) => void;
}

export function ErrorBoundaryInner({
    children,
    useRetry = true,
    onReportProblem,
}: ErrorBoundaryProps) {
    return (
        <ErrorBoundaryBase
            onError={(error, info) => {
                registerError(error, info.componentStack ?? undefined, 'error-boundary');
            }}
            fallbackRender={({error, resetErrorBoundary}) => {
                return (
                    <ErrorBoundaryFallback
                        error={error}
                        useRetry={useRetry}
                        resetErrorBoundary={resetErrorBoundary}
                        onReportProblem={onReportProblem}
                    />
                );
            }}
        >
            {children}
        </ErrorBoundaryBase>
    );
}

interface ErrorBoundaryFallbackProps {
    error: Error;
    useRetry?: boolean;
    resetErrorBoundary?: () => void;
    onReportProblem?: (error?: Error) => void;
}
export function ErrorBoundaryFallback({
    error,
    resetErrorBoundary,
    useRetry,
    onReportProblem,
}: ErrorBoundaryFallbackProps) {
    return (
        <div className={b()}>
            <Illustration name="error" className={b('illustration')} />
            <div className={b('content')}>
                <h2 className={b('error-title')}>{i18n('error-title')}</h2>
                <div className={b('error-description')}>{i18n('error-description')}</div>
                <Disclosure summary={i18n('show-details')} className={b('show-details')} size="m">
                    <pre className={b('error-details')}>{error.stack}</pre>
                </Disclosure>
                <div className={b('actions')}>
                    {useRetry && (
                        <Button view="outlined" onClick={resetErrorBoundary}>
                            {i18n('button-reset')}
                        </Button>
                    )}
                    {onReportProblem && (
                        <Button view="outlined" onClick={() => onReportProblem(error)}>
                            {i18n('report-problem')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
