import React from 'react';

import {GravityGraph} from '../../../../../../components/Graph/GravityGraph';
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

function isValidGraphData(data: Partial<PreparedPlan>) {
    return Boolean(data.links && data.nodes && data.nodes.length);
}

export function Graph({explain = {}, theme}: GraphProps) {
    const {links, nodes} = explain;

    const data = React.useMemo(() => ({links: links || [], nodes: nodes || []}), [links, nodes]);

    if (!isValidGraphData(data)) {
        return <StubMessage message={i18n('description.graph-is-not-supported')} />;
    }

    return (
        <div className={b('canvas-container')}>
            <GravityGraph data={data} theme={theme} key={theme} />
        </div>
    );
}
