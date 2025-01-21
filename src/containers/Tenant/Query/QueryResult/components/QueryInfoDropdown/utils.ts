import type {planToSvgApi} from '../../../../../../store/reducers/planToSvg';
import type {QueryPlan, ScriptPlan, TKqpStatsQuery} from '../../../../../../types/api/query';
import createToast from '../../../../../../utils/createToast';
import {prepareCommonErrorMessage} from '../../../../../../utils/errors';
import {parseQueryError} from '../../../../../../utils/query';
import i18n from '../../i18n';

export interface QueryResultsInfo {
    ast?: string;
    stats?: TKqpStatsQuery;
    queryText?: string;
    plan?: QueryPlan | ScriptPlan;
}

export interface DiagnosticsData extends QueryResultsInfo {
    database: string;
    error?: ReturnType<typeof parseQueryError>;
}

interface GetSvgParams {
    plan: QueryPlan | ScriptPlan;
    database: string;
    blobUrl: string | null;
    getPlanToSvg: ReturnType<typeof planToSvgApi.useLazyPlanToSvgQueryQuery>[0];
    setBlobUrl: (url: string) => void;
}

export const handleGetSvg = async ({
    plan,
    database,
    blobUrl,
    getPlanToSvg,
    setBlobUrl,
}: GetSvgParams): Promise<string | null> => {
    if (blobUrl) {
        return Promise.resolve(blobUrl);
    }

    try {
        const {data: result} = await getPlanToSvg({plan, database});
        if (!result) {
            throw new Error('No result from planToSvg');
        }
        const blob = new Blob([result], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return url;
    } catch (err) {
        const errorMessage = prepareCommonErrorMessage(err);
        createToast({
            title: i18n('text_error-plan-svg', {error: errorMessage}),
            name: 'plan-svg-error',
            type: 'error',
        });
        return null;
    }
};

interface HandlersParams extends GetSvgParams {}

export const createHandleOpenInNewTab = (params: HandlersParams) => () => {
    handleGetSvg(params).then((url) => {
        if (url) {
            window.open(url, '_blank');
        }
    });
};

export const createHandleDownload = (params: HandlersParams) => () => {
    handleGetSvg(params).then((url) => {
        const link = document.createElement('a');
        if (url) {
            link.href = url;
            link.download = 'query-plan.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
};

interface DiagnosticsDownloadParams {
    queryResultsInfo: QueryResultsInfo;
    database: string;
    error?: unknown;
}

export const createHandleDiagnosticsDownload =
    ({queryResultsInfo, database, error}: DiagnosticsDownloadParams) =>
    () => {
        const parsedError = error ? parseQueryError(error) : undefined;
        const diagnosticsData: DiagnosticsData = {
            ...queryResultsInfo,
            database,
            ...(parsedError && {error: parsedError}),
        };

        const blob = new Blob([JSON.stringify(diagnosticsData, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `query-diagnostics-${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
