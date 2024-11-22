import {YDBGraph} from '../../../../../../components/Graph/Graph';
import type {PreparedPlan} from '../../../../../../store/reducers/query/types';
import {cn} from '../../../../../../utils/cn';
import i18n from '../../i18n';
import {StubMessage} from '../Stub/Stub';

import './Graph.scss';

const b = cn('ydb-query-explain-graph');

interface GraphProps {
    explain?: PreparedPlan;
    theme?: string;
}

export function Graph({explain = {}, theme}: GraphProps) {
    const {links, nodes} = explain;

    const isEnoughDataForGraph = links && nodes && nodes.length;

    if (!isEnoughDataForGraph) {
        return <StubMessage message={i18n('description.graph-is-not-supported')} />;
    }

    return (
        <div className={b('canvas-container')}>
            <YDBGraph key={theme} data={{links, nodes}} />
        </div>
    );
}
