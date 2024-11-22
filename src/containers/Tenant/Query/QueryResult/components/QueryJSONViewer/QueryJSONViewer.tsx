import JSONTree from 'react-json-inspector';

import {cn} from '../../../../../../utils/cn';

import './QueryJSONViewer.scss';
import 'react-json-inspector/json-inspector.css';

const b = cn('ydb-query-json-viewer');

interface QueryJSONViewerProps {
    data?: object;
}

export function QueryJSONViewer({data}: QueryJSONViewerProps) {
    return (
        <JSONTree
            data={data}
            isExpanded={() => true}
            className={b('inspector')}
            searchOptions={{
                debounceTime: 300,
            }}
        />
    );
}
