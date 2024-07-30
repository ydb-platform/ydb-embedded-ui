import {YDBGraph} from '../../../../../../components/Graph/Graph';
import type {PreparedExplainResponse} from '../../../../../../store/reducers/explainQuery/types';
import {explainVersions} from '../../../../../../store/reducers/explainQuery/utils';
import {cn} from '../../../../../../utils/cn';
import i18n from '../../i18n';

import './Graph.scss';

const b = cn('ydb-query-explain-graph');

interface GraphProps {
    explain: PreparedExplainResponse['plan'];
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
