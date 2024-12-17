import React from 'react';

import {useSendOpenTabsMutation} from '../../store/reducers/codeAssist';
import {selectQueriesHistory} from '../../store/reducers/query/query';
import {useTypedSelector} from '../../utils/hooks';

export function CodeAssistantTelemetry() {
    const [sendOpenTabs] = useSendOpenTabsMutation();
    const historyQueries = useTypedSelector(selectQueriesHistory);

    React.useEffect(() => {
        if (!historyQueries?.length) {
            return;
        }

        const tabs = historyQueries.map((query) => ({
            FileName: `query_${query.queryId}.yql`,
            Text: query.queryText,
        }));

        sendOpenTabs(tabs);
    }, [historyQueries, sendOpenTabs]);

    return null;
}
