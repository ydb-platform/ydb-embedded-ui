import JSONTree from 'react-json-inspector';

import type {QueryPlan, ScriptPlan} from '../../../../../../types/api/query';
import {cn} from '../../../../../../utils/cn';

import './TextExplain.scss';
import 'react-json-inspector/json-inspector.css';

const b = cn('ydb-query-explain-text');

interface TextExplainProps {
    explain: QueryPlan | ScriptPlan;
}

export function TextExplain({explain}: TextExplainProps) {
    return (
        <JSONTree
            data={explain}
            isExpanded={() => true}
            className={b('inspector')}
            searchOptions={{
                debounceTime: 300,
            }}
        />
    );
}
