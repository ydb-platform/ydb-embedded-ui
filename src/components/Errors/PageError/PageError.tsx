import React from 'react';

import {Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import {extractErrorDetails, prepareCommonErrorMessage} from '../../../utils/errors';
import {isAccessError, isRedirectToAuth} from '../../../utils/response';
import type {EmptyStateProps} from '../../EmptyState';
import {EmptyState} from '../../EmptyState';
import {Illustration} from '../../Illustration';
import {AccessDenied} from '../403';
import i18n from '../i18n';

import {PageErrorContent} from './PageErrorContent';

import './PageError.scss';

const b = cn('ydb-page-error');

const ILLUSTRATION_SIZE = 230;

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
    errorPageTitle,
    defaultMessage,
    className,
}: PageErrorProps) {
    if (isRedirectToAuth(error)) {
        return null;
    }

    if (isAccessError(error)) {
        return (
            <AccessDenied
                title={title}
                description={description}
                pageTitle={errorPageTitle}
                className={b(null, className)}
            />
        );
    }

    if (error || description) {
        const details = extractErrorDetails(error);
        const errorTitle = title || i18n('error.title');
        const fallbackMessage = prepareCommonErrorMessage(
            error,
            defaultMessage ?? i18n('responseError.defaultMessage'),
        );
        const message = details?.title || fallbackMessage;

        if (description) {
            return (
                <EmptyState
                    image={<Illustration name="error" width={ILLUSTRATION_SIZE} />}
                    title={errorTitle}
                    description={description}
                    pageTitle={errorPageTitle}
                    className={b(null, className)}
                />
            );
        }

        return (
            <div className={b(null, className)}>
                {errorPageTitle && (
                    <Text variant="header-1" className={b('page-title')}>
                        {errorPageTitle}
                    </Text>
                )}
                <div className={b('layout')}>
                    <div className={b('illustration')}>
                        <Illustration name="error" width={ILLUSTRATION_SIZE} />
                    </div>
                    <div className={b('body')}>
                        <Text variant="subheader-3">{errorTitle}</Text>
                        <PageErrorContent
                            message={message}
                            dataMessage={details?.dataMessage}
                            details={details}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return <React.Fragment>{children}</React.Fragment>;
}
