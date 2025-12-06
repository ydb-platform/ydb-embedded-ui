import React from 'react';

import {JsonViewer} from '../../../../../../components/JsonViewer/JsonViewer';
import {cn} from '../../../../../../utils/cn';

import './QueryJSONViewer.scss';

const b = cn('ydb-query-json-viewer');

interface QueryJSONViewerProps {
    data?: object;
}

export function QueryJSONViewer({data}: QueryJSONViewerProps) {
    const scrollRef = React.useRef(null);
    return (
        <div className={b()}>
            <div className={b('tree')} ref={scrollRef}>
                <JsonViewer value={data} scrollContainerRef={scrollRef} />
            </div>
        </div>
    );
}
