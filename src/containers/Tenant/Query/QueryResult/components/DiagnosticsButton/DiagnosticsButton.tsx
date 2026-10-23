import {ArrowDownToLine} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import type {QueryPlan, ScriptPlan, TKqpStatsQuery} from '../../../../../../types/api/query';
import {createAndDownloadJsonFile} from '../../../../../../utils/downloadFile';
import {parseQueryError} from '../../../../../../utils/query';
import i18n from '../../i18n';

interface DiagnosticsButtonProps {
    queryText?: string;
    ast?: string;
    stats?: TKqpStatsQuery;
    plan?: QueryPlan | ScriptPlan;
    database: string;
    error?: unknown;
}

export function getDiagnosticsData({error, ...queryResultsInfo}: DiagnosticsButtonProps) {
    const parsedError = error ? parseQueryError(error) : undefined;
    return {...queryResultsInfo, ...(parsedError && {error: parsedError})};
}

export function DiagnosticsButton(props: DiagnosticsButtonProps) {
    return (
        <Button
            view="flat-secondary"
            onClick={() => {
                createAndDownloadJsonFile(
                    getDiagnosticsData(props),
                    `query-diagnostics-${Date.now()}`,
                );
            }}
        >
            <Icon data={ArrowDownToLine} size={16} />
            {i18n('action_diagnostics-json')}
        </Button>
    );
}
