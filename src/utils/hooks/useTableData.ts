import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {isViewType} from '../../containers/Tenant/utils/schema';
import type {AppDispatch} from '../../store';
import {overviewApi} from '../../store/reducers/overview/overview';
import {viewSchemaApi} from '../../store/reducers/viewSchema/viewSchema';
import type {EPathType} from '../../types/api/schema';
import {prepareSchemaData, prepareViewSchema} from '../prepareTableData';

import {useAutoRefreshInterval} from './useAutoRefreshInterval';

interface UseTableDataProps {
    type?: EPathType;
    path: string;
    tenantName: string;
}

const getOverviewData = async (path: string, tenantName: string, dispatch: AppDispatch) => {
    const {data: schemaData} = await dispatch(
        overviewApi.endpoints.getOverview.initiate({
            paths: [path],
            database: tenantName,
        }),
    );
    return schemaData;
};

const getViewSchemaData = async (path: string, tenantName: string, dispatch: AppDispatch) => {
    const {data: viewColumnsData} = await dispatch(
        viewSchemaApi.endpoints.getViewSchema.initiate({path, database: tenantName}),
    );
    return viewColumnsData;
};

export const getTableDataPromise = async (
    path: string,
    tenantName: string,
    type: EPathType,
    dispatch: AppDispatch,
) => {
    const schemaData = await getOverviewData(path, tenantName, dispatch);
    const viewColumnsData = isViewType(type)
        ? await getViewSchemaData(path, tenantName, dispatch)
        : null;

    return isViewType(type) && viewColumnsData
        ? prepareViewSchema(viewColumnsData)
        : prepareSchemaData(type, schemaData?.data);
};

export const useTableData = ({type, path, tenantName}: UseTableDataProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const overviewQuery = overviewApi.useGetOverviewQuery(
        {
            paths: [path],
            database: tenantName,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const viewSchemaQuery = viewSchemaApi.useGetViewSchemaQuery(
        isViewType(type) ? {path, database: tenantName} : skipToken,
    );

    const tableData = React.useMemo(() => {
        if (isViewType(type)) {
            return prepareViewSchema(viewSchemaQuery.data);
        }
        return prepareSchemaData(type, overviewQuery.currentData?.data);
    }, [overviewQuery.currentData?.data, type, viewSchemaQuery.data]);

    return {
        tableData,
        isViewSchemaLoading: viewSchemaQuery.isLoading,
        isOverviewLoading: overviewQuery.isLoading,
    };
};
