import React from 'react';

import {isAccessError, isRedirectToAuth} from '../../../utils/response';
import type {EmptyStateProps} from '../../EmptyState';
import {EmptyState} from '../../EmptyState';
import {Illustration} from '../../Illustration';
import {AccessDenied} from '../403';
import {ResponseError} from '../ResponseError';
import i18n from '../i18n';

interface PageErrorProps extends Omit<EmptyStateProps, 'image' | 'title' | 'description'> {
    title?: string;
    description?: string;
    error: unknown;
    children?: React.ReactNode;
}

export function PageError({title, description, error, children, ...restProps}: PageErrorProps) {
    if (isRedirectToAuth(error)) {
        // Do not show an error, because we redirect to auth anyway.
        return null;
    }

    if (isAccessError(error)) {
        return <AccessDenied title={title} description={description} {...restProps} />;
    }

    if (error || description) {
        return (
            <EmptyState
                image={<Illustration name="error" />}
                title={title || i18n('error.title')}
                description={error ? <ResponseError error={error} /> : description}
                {...restProps}
            />
        );
    }

    return <React.Fragment>{children}</React.Fragment>;
}
