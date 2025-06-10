import {useSelector} from 'react-redux';
import {useLocation} from 'react-router-dom';

import {parseQuery} from '../../../routes';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {useDatabaseFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';

export interface ChatContext {
    // Current page context
    currentPage:
        | 'cluster'
        | 'tenant'
        | 'node'
        | 'pDisk'
        | 'vDisk'
        | 'tablet'
        | 'storageGroup'
        | 'unknown';

    // Key identifiers
    clusterName?: string;
    tenantName?: string;
    nodeId?: string;
    tabletId?: string;
    pDiskId?: string;
    vDiskId?: string;
    storageGroupId?: string;

    // Current view/tab
    activeTab?: string;

    // URL for reference
    currentPath: string;
}

function extractPageSpecificContext(
    page: string,
    query: any,
    pageBreadcrumbsOptions: any,
    database: string | undefined,
): Partial<ChatContext> {
    const pageContext: Partial<ChatContext> = {};

    switch (page) {
        case 'tenant':
            pageContext.tenantName = database || pageBreadcrumbsOptions?.tenantName;
            break;

        case 'node':
            pageContext.nodeId =
                (query.nodeId as string) || pageBreadcrumbsOptions?.nodeId?.toString();
            pageContext.activeTab =
                (query.activeTab as string) || pageBreadcrumbsOptions?.nodeActiveTab;
            break;

        case 'tablet':
            pageContext.tabletId = (query.id as string) || pageBreadcrumbsOptions?.tabletId;
            pageContext.tenantName = database || pageBreadcrumbsOptions?.tenantName;
            break;

        case 'pDisk':
            pageContext.pDiskId =
                (query.pDiskId as string) || pageBreadcrumbsOptions?.pDiskId?.toString();
            pageContext.nodeId =
                (query.nodeId as string) || pageBreadcrumbsOptions?.nodeId?.toString();
            break;

        case 'vDisk':
            pageContext.vDiskId = query.vDiskId as string;
            pageContext.pDiskId =
                (query.pDiskId as string) || pageBreadcrumbsOptions?.pDiskId?.toString();
            pageContext.nodeId =
                (query.nodeId as string) || pageBreadcrumbsOptions?.nodeId?.toString();
            break;

        case 'storageGroup':
            pageContext.storageGroupId =
                (query.groupId as string) || pageBreadcrumbsOptions?.groupId;
            break;

        case 'cluster':
            pageContext.activeTab =
                (query.activeTab as string) || pageBreadcrumbsOptions?.clusterTab;
            break;
    }

    return pageContext;
}

export function useCurrentContext(): ChatContext {
    const location = useLocation();
    const query = parseQuery(location);
    const {title: clusterTitle} = useClusterBaseInfo();
    const database = useDatabaseFromQuery();
    const {page, pageBreadcrumbsOptions} = useSelector((state: any) => state.header);

    const baseContext: ChatContext = {
        currentPage: page || 'unknown',
        currentPath: location.pathname,
        clusterName: clusterTitle || (query.clusterName as string),
    };

    const pageSpecificContext = extractPageSpecificContext(
        page,
        query,
        pageBreadcrumbsOptions,
        database,
    );

    return {...baseContext, ...pageSpecificContext};
}

export function formatContextForAI(context: ChatContext): string {
    const parts: string[] = [];

    parts.push(`User is currently viewing: ${context.currentPage} page`);

    if (context.clusterName) {
        parts.push(`Cluster: ${context.clusterName}`);
    }

    if (context.tenantName) {
        parts.push(`Database: ${context.tenantName}`);
    }

    if (context.nodeId) {
        parts.push(`Node ID: ${context.nodeId}`);
    }

    if (context.tabletId) {
        parts.push(`Tablet ID: ${context.tabletId}`);
    }

    if (context.pDiskId) {
        parts.push(`PDisk ID: ${context.pDiskId}`);
    }

    if (context.vDiskId) {
        parts.push(`VDisk ID: ${context.vDiskId}`);
    }

    if (context.storageGroupId) {
        parts.push(`Storage Group ID: ${context.storageGroupId}`);
    }

    if (context.activeTab) {
        parts.push(`Active Tab: ${context.activeTab}`);
    }

    parts.push(`URL Path: ${context.currentPath}`);

    return parts.join('\n');
}
