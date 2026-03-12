import React from 'react';

import {ArrowShapeUpFromLine} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {uiFactory} from '../../../uiFactory/uiFactory';
import {cn} from '../../../utils/cn';
import {getIllustration} from '../../../utils/illustrations';
import {isForbiddenError, isRedirectToAuth, isUnauthenticatedError} from '../../../utils/response';
import type {EmptyStateProps} from '../../EmptyState';
import {EMPTY_STATE_SIZES, EmptyState} from '../../EmptyState';
import {Unauthenticated} from '../401';
import {AccessDenied} from '../403';
import {ResponseErrorMessage, useErrorInfo} from '../ResponseError';
import i18n from '../i18n';

import './PageError.scss';

const b = cn('ydb-page-error');

type PageErrorIllustrationSize = keyof typeof EMPTY_STATE_SIZES;

interface PageErrorProps extends Omit<EmptyStateProps, 'image' | 'title' | 'contentPosition'> {
    title?: React.ReactNode;
    error: unknown;
    children?: React.ReactNode;
    errorPageTitle?: string;
    defaultMessage?: string;
    illustrationSize?: PageErrorIllustrationSize;
}

export function PageError({
    title,
    description,
    error,
    children,
    size = 'm',
    illustrationSize,
    errorPageTitle,
    defaultMessage,
    className,
    pageTitle: callerPageTitle,
    ...restProps
}: PageErrorProps) {
    const resolvedPageTitle = errorPageTitle ?? callerPageTitle;

    if (isRedirectToAuth(error)) {
        return null;
    }

    if (isUnauthenticatedError(error)) {
        return (
            <Unauthenticated
                title={title}
                description={description}
                {...restProps}
                pageTitle={resolvedPageTitle}
                className={b(null, className)}
            />
        );
    }

    if (isForbiddenError(error)) {
        return (
            <AccessDenied
                title={title}
                description={description}
                {...restProps}
                pageTitle={resolvedPageTitle}
                className={b(null, className)}
            />
        );
    }

    if (error || description) {
        return (
            <PageErrorContent
                title={title}
                description={description}
                error={error}
                size={size}
                illustrationSize={illustrationSize}
                errorPageTitle={resolvedPageTitle}
                defaultMessage={defaultMessage}
                className={className}
                {...restProps}
            />
        );
    }

    return <React.Fragment>{children}</React.Fragment>;
}

interface PageErrorContentProps
    extends Omit<EmptyStateProps, 'image' | 'title' | 'contentPosition'> {
    title?: React.ReactNode;
    error: unknown;
    errorPageTitle?: string;
    defaultMessage?: string;
    illustrationSize?: PageErrorIllustrationSize;
}

function PageErrorContent({
    title: titleProp,
    description,
    error,
    size = 'm',
    illustrationSize,
    errorPageTitle,
    defaultMessage,
    className,
    actions: callerActions,
    ...restProps
}: PageErrorContentProps) {
    const {
        title: errorTitle,
        subtitle,
        showSubtitle,
        details,
    } = useErrorInfo(error, defaultMessage);

    const resolvedTitle = titleProp || errorTitle || i18n('error.title');
    const shouldShowHttpSubtitle =
        Boolean(titleProp) &&
        details?.errorCode === 'ERR_NETWORK' &&
        details.status !== undefined &&
        Boolean(errorTitle) &&
        errorTitle !== resolvedTitle;
    const resolvedSubtitle = shouldShowHttpSubtitle ? errorTitle : subtitle;
    const resolvedShowSubtitle = shouldShowHttpSubtitle || showSubtitle;

    const reportProblemUrl = React.useMemo(() => {
        if (!uiFactory.getReportProblemUrl) {
            return undefined;
        }
        return uiFactory.getReportProblemUrl({
            errorTitle: typeof resolvedTitle === 'string' ? resolvedTitle : undefined,
            requestUrl: details?.requestUrl,
            traceId: details?.traceId,
        });
    }, [resolvedTitle, details?.requestUrl, details?.traceId]);

    const mergedActions = React.useMemo(() => {
        const result: React.ReactNode[] = [];
        if (callerActions) {
            result.push(...callerActions);
        }
        if (reportProblemUrl) {
            result.push(
                <Button key="report" view="normal" size="m" href={reportProblemUrl} target="_blank">
                    <Icon data={ArrowShapeUpFromLine} size={16} />
                    {i18n('error-details.button_report-problem')}
                </Button>,
            );
        }
        return result.length > 0 ? result : undefined;
    }, [callerActions, reportProblemUrl]);

    const resolvedIllustrationSize = EMPTY_STATE_SIZES[illustrationSize ?? size];
    const InternalErrorImage = getIllustration('InternalError');

    return (
        <EmptyState
            image={
                <InternalErrorImage
                    width={resolvedIllustrationSize}
                    height={resolvedIllustrationSize}
                />
            }
            title={resolvedTitle}
            description={
                error ? (
                    <ResponseErrorMessage
                        subtitle={resolvedSubtitle}
                        showSubtitle={resolvedShowSubtitle}
                        details={details}
                        renderedTitle={
                            typeof resolvedTitle === 'string' ? resolvedTitle : undefined
                        }
                    />
                ) : (
                    description
                )
            }
            {...restProps}
            actions={mergedActions}
            size={size}
            contentPosition="top"
            pageTitle={errorPageTitle}
            className={b(null, className)}
        />
    );
}
