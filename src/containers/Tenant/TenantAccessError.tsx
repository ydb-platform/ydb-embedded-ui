import type React from 'react';

import {PageError} from '../../components/Errors/PageError/PageError';
import {selectDatabaseCapabilities} from '../../store/reducers/capabilities/capabilities';
import type {AccessErrorContext} from '../../uiFactory/types';
import {uiFactory} from '../../uiFactory/uiFactory';
import {useTypedSelector} from '../../utils/hooks';
import {isForbiddenError} from '../../utils/response';

interface TenantAccessErrorProps extends Omit<AccessErrorContext, 'capabilities'> {
    error: unknown;
    errorPageTitle?: string;
    children?: React.ReactNode;
}

export function TenantAccessError({
    error,
    errorPageTitle,
    children,
    ...context
}: TenantAccessErrorProps) {
    const getErrorProps = isForbiddenError(error) ? uiFactory.access?.getErrorProps : undefined;
    const capabilities = useTypedSelector((state) =>
        getErrorProps ? selectDatabaseCapabilities(state, context.database).data : undefined,
    );
    const defaultProps = error ? uiFactory.clusterOrDatabaseAccessError : undefined;
    const customProps = getErrorProps?.({...context, capabilities});
    const actions = customProps?.actions
        ? [...(defaultProps?.actions ?? []), ...customProps.actions]
        : defaultProps?.actions;

    return (
        <PageError
            error={error}
            {...defaultProps}
            title={customProps?.title ?? defaultProps?.title}
            description={customProps?.description ?? defaultProps?.description}
            actions={actions}
            size="l"
            illustrationSize="m"
            errorPageTitle={errorPageTitle}
        >
            {children}
        </PageError>
    );
}
