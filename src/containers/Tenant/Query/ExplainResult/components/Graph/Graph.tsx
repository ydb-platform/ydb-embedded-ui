import {YDBGraph} from '../../../../../../components/Graph/Graph';
import {explainVersions} from '../../../../../../store/reducers/query/prepareQueryData';
import type {PreparedPlan} from '../../../../../../store/reducers/query/types';
import {cn} from '../../../../../../utils/cn';
import i18n from '../../i18n';

import './Graph.scss';

const b = cn('ydb-query-explain-graph');

interface GraphProps {
    explain: PreparedPlan;
    theme: string;
}

export function Graph({explain, theme}: GraphProps) {
    const {links, nodes, version} = explain ?? {};

    const isSupportedVersion = version === explainVersions.v2;
    const isEnoughDataForGraph = links && nodes && nodes.length;

    const content =
        isSupportedVersion && isEnoughDataForGraph ? (
            <div className={b('canvas-container')}>
                <YDBGraph key={theme} data={{links, nodes}} />
            </div>
        ) : (
            <div className={b('text-message')}>{i18n('description.graph-is-not-supported')}</div>
        );
    return content;
}
