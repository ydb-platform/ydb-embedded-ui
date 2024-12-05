import {JSONTreeWithSearch} from '../../../../../../components/JSONTreeWithSearch/JSONTreeWithSearch';
import {cn} from '../../../../../../utils/cn';

import './QueryJSONViewer.scss';

const b = cn('ydb-query-json-viewer');

interface QueryJSONViewerProps {
    data?: object;
}

export function QueryJSONViewer({data}: QueryJSONViewerProps) {
    return (
        <div className={b('inspector')}>
            <JSONTreeWithSearch data={data} isExpanded={() => true} />
        </div>
    );
}
