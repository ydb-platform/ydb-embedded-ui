import React from 'react';

import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';

export function useTenantQueryParams() {
    const [{showHealthcheck, database, schema, view, issuesFilter, name}, setQueryParams] =
        useQueryParams({
            showHealthcheck: BooleanParam,
            database: StringParam,
            schema: StringParam,
            view: StringParam,
            issuesFilter: StringParam,
            name: StringParam,
        });
    const handleShowHealthcheckChange = React.useCallback(
        (value?: boolean) => {
            setQueryParams({showHealthcheck: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleDatabaseChange = React.useCallback(
        (value?: string) => {
            setQueryParams({database: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleSchemaChange = React.useCallback(
        (value?: string) => {
            setQueryParams({schema: value}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleIssuesFilterChange = React.useCallback(
        (value?: string) => {
            setQueryParams({issuesFilter: value}, 'replaceIn');
        },
        [setQueryParams],
    );
    const handleHealthcheckViewChange = React.useCallback(
        (value?: string) => {
            setQueryParams({view: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    return {
        showHealthcheck,
        handleShowHealthcheckChange,
        database,
        handleDatabaseChange,
        schema,
        handleSchemaChange,
        view,
        handleHealthcheckViewChange,
        issuesFilter,
        handleIssuesFilterChange,
        name,
    };
}
