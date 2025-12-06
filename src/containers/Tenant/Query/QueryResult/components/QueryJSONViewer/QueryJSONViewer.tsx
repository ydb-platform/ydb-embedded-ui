import React from 'react';

import {JsonViewer} from '../../../../../../components/JsonViewer/JsonViewer';
import {cn} from '../../../../../../utils/cn';
import {useTypedSelector} from '../../../../../../utils/hooks';

import './QueryJSONViewer.scss';

const b = cn('ydb-query-json-viewer');

interface QueryJSONViewerProps {
    data?: object;
}

export function QueryJSONViewer({data}: QueryJSONViewerProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    return (
        <div className={b()}>
            <div className={b('tree')} ref={scrollRef}>
                <JsonViewer
                    value={data}
                    scrollContainerRef={scrollRef} // key is used to reset JsonViewer state to collapsed due to performance issues on close fullscreen mode if nodes quantity is big enough https://github.com/ydb-platform/ydb-embedded-ui/issues/2265
                    key={String(isFullscreen)}
                />
            </div>
        </div>
    );
}
