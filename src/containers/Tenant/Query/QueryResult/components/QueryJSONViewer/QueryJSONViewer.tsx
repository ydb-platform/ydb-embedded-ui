import {JsonViewer} from '../../../../../../components/JsonViewer/JsonViewer';
import {useUnipikaConvert} from '../../../../../../components/JsonViewer/unipika/unipika';
import {cn} from '../../../../../../utils/cn';

import './QueryJSONViewer.scss';

const b = cn('ydb-query-json-viewer');

interface QueryJSONViewerProps {
    data?: object;
}

export function QueryJSONViewer({data}: QueryJSONViewerProps) {
    const convertedData = useUnipikaConvert(data);
    return (
        <div className={b()}>
            <div className={b('tree')}>
                <JsonViewer value={convertedData} />
            </div>
        </div>
    );
}
