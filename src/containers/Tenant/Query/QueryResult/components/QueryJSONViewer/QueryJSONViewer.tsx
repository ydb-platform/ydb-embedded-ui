import {JSONTree} from '../../../../../../components/JSONTree/JSONTree';
import {cn} from '../../../../../../utils/cn';

import './QueryJSONViewer.scss';

const b = cn('ydb-query-json-viewer');

interface QueryJSONViewerProps {
    data?: object;
}

export function QueryJSONViewer({data}: QueryJSONViewerProps) {
    return (
        <div className={b('inspector')}>
            <JSONTree data={data} isExpanded={() => true} />
        </div>
    );
}
