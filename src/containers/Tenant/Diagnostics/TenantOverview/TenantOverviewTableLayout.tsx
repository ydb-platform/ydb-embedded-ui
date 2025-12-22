import React from 'react';

import type {NoStrictEntityMods} from '@bem-react/classname';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';

import {b} from './utils';

interface TenantOverviewTableLayoutProps {
    title?: React.ReactNode;
    loading?: boolean;
    error?: unknown;
    tableClassNameModifiers?: NoStrictEntityMods;
    withData?: boolean;
    children?: React.ReactNode;
}

export function TenantOverviewTableLayout({
    title,
    error,
    loading,
    tableClassNameModifiers = {},
    withData,
    children,
}: TenantOverviewTableLayoutProps) {
    const renderContent = () => {
        if (error && !withData) {
            return null;
        }

        if (loading) {
            return <TableSkeleton rows={TENANT_OVERVIEW_TABLES_LIMIT} />;
        }

        return children;
    };
    return (
        <React.Fragment>
            {title && <div className={b('title')}>{title}</div>}
            {error ? <ResponseError error={error} /> : null}
            <div className={b('table', tableClassNameModifiers)}>{renderContent()}</div>
        </React.Fragment>
    );
}
