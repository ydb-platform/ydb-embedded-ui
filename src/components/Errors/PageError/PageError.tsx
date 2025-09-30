import React from 'react';

import {cn} from '../../../utils/cn';
import {isAccessError, isRedirectToAuth} from '../../../utils/response';
import type {EmptyStateProps} from '../../EmptyState';
import {EMPTY_STATE_SIZES, EmptyState} from '../../EmptyState';
import {Illustration} from '../../Illustration';
import {AccessDenied} from '../403';
import {ResponseError} from '../ResponseError';
import i18n from '../i18n';

import './PageError.scss';

const b = cn('ydb-page-error');

interface PageErrorProps extends Omit<EmptyStateProps, 'image' | 'title'> {
    title?: React.ReactNode;
    error: unknown;
    children?: React.ReactNode;
    errorPageTitle?: string;
}

export function PageError({
    title,
    description,
    error,
    children,
    size = 'm',
    errorPageTitle,
    ...restProps
}: PageErrorProps) {
    if (isRedirectToAuth(error)) {
        // Do not show an error, because we redirect to auth anyway.
        return null;
    }

    if (isAccessError(error)) {
        return (
            <AccessDenied
                title={title}
                description={description}
                {...restProps}
                pageTitle={errorPageTitle}
                className={b()}
            />
        );
    }

    if (error || description) {
        return (
            <EmptyState
                image={<Illustration name="error" width={EMPTY_STATE_SIZES[size]} />}
                title={title || i18n('error.title')}
                description={error ? <ResponseError error={error} /> : description}
                pageTitle={errorPageTitle}
                className={b()}
                {...restProps}
            />
        );
    }

    return <React.Fragment>{children}</React.Fragment>;
}
