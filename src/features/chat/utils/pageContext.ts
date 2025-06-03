import { useLocation, useParams } from 'react-router-dom';
import { useQueryParams } from 'use-query-params';
import { StringParam } from 'use-query-params';

export interface PageContext {
    pageType: string;
    entityId?: string;
    entityName?: string;
    clusterName?: string;
    database?: string;
    activeTab?: string;
    nodeId?: string;
    tabletId?: string;
    pDiskId?: string;
    vDiskId?: string;
    groupId?: string;
    description: string;
}

const PAGE_TYPE_DESCRIPTIONS = {
    node: 'страница ноды',
    cluster: 'страница кластера',
    tenant: 'страница тенанта/базы данных',
    tablet: 'страница таблетки',
    pDisk: 'страница физического диска',
    vDisk: 'страница виртуального диска',
    storageGroup: 'страница группы хранения',
    clusters: 'список кластеров',
    auth: 'страница авторизации',
    unknown: 'неизвестная страница'
};

const TAB_DESCRIPTIONS = {
    // Node tabs
    storage: 'хранилище',
    tablets: 'таблетки',
    structure: 'структура',
    
    // Cluster tabs
    tenants: 'тенанты',
    nodes: 'ноды',
    overview: 'обзор',
    
    // Tenant tabs
    query: 'запросы',
    diagnostics: 'диагностика',
    summary: 'сводка',
    metrics: 'метрики'
};

function extractPageTypeFromPath(pathname: string): string {
    if (pathname.startsWith('/node/')) return 'node';
    if (pathname.startsWith('/cluster')) return 'cluster';
    if (pathname.startsWith('/tenant')) return 'tenant';
    if (pathname.startsWith('/tablet/')) return 'tablet';
    if (pathname.startsWith('/pDisk')) return 'pDisk';
    if (pathname.startsWith('/vDisk')) return 'vDisk';
    if (pathname.startsWith('/storageGroup')) return 'storageGroup';
    if (pathname === '/clusters') return 'clusters';
    if (pathname === '/auth') return 'auth';
    return 'unknown';
}

function formatContextDescription(context: Omit<PageContext, 'description'>): string {
    const pageTypeDesc = PAGE_TYPE_DESCRIPTIONS[context.pageType as keyof typeof PAGE_TYPE_DESCRIPTIONS] || context.pageType;
    let description = `Пользователь находится на ${pageTypeDesc}`;
    
    if (context.clusterName) {
        description += `\nКластер: "${context.clusterName}"`;
    }
    
    if (context.database) {
        description += `\nБаза данных: "${context.database}"`;
    }
    
    if (context.entityId) {
        switch (context.pageType) {
            case 'node':
                description += `\nID ноды: ${context.entityId}`;
                break;
            case 'tablet':
                description += `\nID таблетки: ${context.entityId}`;
                break;
            default:
                description += `\nID объекта: ${context.entityId}`;
        }
    }
    
    if (context.activeTab) {
        const tabDesc = TAB_DESCRIPTIONS[context.activeTab as keyof typeof TAB_DESCRIPTIONS] || context.activeTab;
        description += `\nАктивная вкладка: "${tabDesc}"`;
    }
    
    // Добавляем специфичную информацию для разных типов страниц
    switch (context.pageType) {
        case 'node':
            if (context.entityId) {
                description += `\nПользователь может запросить информацию о состоянии ноды, её нагрузке, дисках или таблетках`;
            }
            break;
        case 'cluster':
            description += `\nПользователь может запросить информацию о состоянии кластера, его нодах или тенантах`;
            break;
        case 'tenant':
            if (context.database) {
                description += `\nПользователь может запросить информацию о базе данных, её схеме или выполнить запросы`;
            }
            break;
    }
    
    return description;
}

export function usePageContext(): PageContext {
    const location = useLocation();
    const params = useParams<{id?: string; activeTab?: string}>();
    const [queryParams] = useQueryParams({
        clusterName: StringParam,
        backend: StringParam,
        database: StringParam,
        nodeId: StringParam,
        pDiskId: StringParam,
        vDiskId: StringParam,
        groupId: StringParam,
    });
    
    const pageType = extractPageTypeFromPath(location.pathname);
    
    const context: Omit<PageContext, 'description'> = {
        pageType,
        clusterName: queryParams.clusterName || undefined,
        database: queryParams.database || undefined,
        nodeId: queryParams.nodeId || undefined,
        pDiskId: queryParams.pDiskId || undefined,
        vDiskId: queryParams.vDiskId || undefined,
        groupId: queryParams.groupId || undefined,
    };
    
    // Извлекаем параметры из пути в зависимости от типа страницы
    switch (pageType) {
        case 'node':
            context.entityId = params.id;
            context.activeTab = params.activeTab;
            break;
        case 'cluster':
            context.activeTab = params.activeTab;
            break;
        case 'tablet':
            context.entityId = params.id;
            context.tabletId = params.id;
            break;
    }
    
    const description = formatContextDescription(context);
    
    return {
        ...context,
        description
    };
}

// Функция для использования вне React компонентов
export function extractPageContextFromLocation(
    pathname: string,
    search: string,
    params: Record<string, string> = {}
): PageContext {
    const pageType = extractPageTypeFromPath(pathname);
    const searchParams = new URLSearchParams(search);
    
    const context: Omit<PageContext, 'description'> = {
        pageType,
        clusterName: searchParams.get('clusterName') || undefined,
        database: searchParams.get('database') || undefined,
        nodeId: searchParams.get('nodeId') || undefined,
        pDiskId: searchParams.get('pDiskId') || undefined,
        vDiskId: searchParams.get('vDiskId') || undefined,
        groupId: searchParams.get('groupId') || undefined,
    };
    
    // Извлекаем параметры из переданных params
    Object.assign(context, params);
    
    const description = formatContextDescription(context);
    
    return {
        ...context,
        description
    };
}
