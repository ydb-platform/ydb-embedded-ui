import type {ReactNode} from 'react';
import {ErrorBoundary as ErrorBoundaryBase} from 'react-error-boundary';
import cn from 'bem-cn-lite';

import {Button, Disclosure} from '@gravity-ui/uikit';

import {registerError} from '../../utils/registerError';
import {Illustration} from '../Illustration';
import i18n from './i18n';
import './ErrorBoundary.scss';

const b = cn('ydb-error-boundary');

interface ErrorBoundaryProps {
    children?: ReactNode;
    useRetry?: boolean;
    onReportProblem?: (error?: Error) => void;
}

export const ErrorBoundary = ({children, useRetry = true, onReportProblem}: ErrorBoundaryProps) => {
    return (
        <ErrorBoundaryBase
            onError={(error, info) => {
                registerError(error, info.componentStack, 'error-boundary');
            }}
            fallbackRender={({error, resetErrorBoundary}) => {
                return (
                    <div className={b(null)}>
                        <Illustration name="error" className={b('illustration')} />
                        <div className={b('content')}>
                            <h2 className={b('error-title')}>{i18n('error-title')}</h2>
                            <div className={b('error-description')}>
                                {i18n('error-description')}
                            </div>
                            <Disclosure
                                summary={i18n('show-details')}
                                className={b('show-details')}
                                size="m"
                            >
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
            }}
        >
            {children}
        </ErrorBoundaryBase>
    );
};
