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
    defaultMessage?: string;
}

export function PageError({
    title,
    description,
    error,
    children,
    size = 'm',
    errorPageTitle,
    defaultMessage,
    ...restProps
}: PageErrorProps) {
    if (isRedirectToAuth(error)) {
        return null;
    }

    if (isAccessError(error)) {
        return (
            <AccessDenied
                title={title}
                description={description}
                {...restProps}
                pageTitle={errorPageTitle}
                className={b(null, restProps.className)}
            />
        );
    }

    if (error || description) {
        return (
            <EmptyState
                image={<Illustration name="error" width={EMPTY_STATE_SIZES[size]} />}
                title={title || i18n('error.title')}
                description={
                    error ? (
                        <ResponseError error={error} defaultMessage={defaultMessage} />
                    ) : (
                        description
                    )
                }
                {...restProps}
                pageTitle={errorPageTitle}
                className={b(null, restProps.className)}
            />
        );
    }

    return <React.Fragment>{children}</React.Fragment>;
}
