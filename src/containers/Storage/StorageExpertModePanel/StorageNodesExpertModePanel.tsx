import {useStorageQueryParams} from '../useStorageQueryParams';

import {ExpertModePanelLayout, ExpertModeRow} from './components/ExpertModePanelLayout';
import type {ExpertModeOption} from './components/ExpertModePanelLayout';
import {renderPDiskLegend, renderVDiskLegend} from './components/renderExpertModeLegend';
import {PDisksGroupBy, VDisksGroupBy} from './constants';
import type {NodesPDisksGroupByValue, NodesVDisksGroupByValue} from './constants';
import i18n from './i18n';

interface StorageNodesExpertModePanelProps {
    className?: string;
}

function getVDiskOptions(): ExpertModeOption<NodesVDisksGroupByValue>[] {
    return [
        {value: VDisksGroupBy.State, content: i18n('value_state')},
        {value: VDisksGroupBy.Space, content: i18n('value_space')},
        {value: VDisksGroupBy.FrontQueues, content: i18n('value_front-queues')},
        {value: VDisksGroupBy.Compaction, content: i18n('value_compaction')},
        {value: VDisksGroupBy.All, content: i18n('value_all')},
    ];
}

function getPDiskOptions(): ExpertModeOption<NodesPDisksGroupByValue>[] {
    return [
        {value: PDisksGroupBy.State, content: i18n('value_pdisks-state')},
        {value: PDisksGroupBy.Space, content: i18n('value_pdisks-space')},
        {value: PDisksGroupBy.Drive, content: i18n('value_pdisks-drive')},
        {value: PDisksGroupBy.Decommit, content: i18n('value_pdisks-decommit')},
        {value: PDisksGroupBy.Maintenance, content: i18n('value_pdisks-maintenance')},
        {value: PDisksGroupBy.Device, content: i18n('value_pdisks-device')},
        {value: PDisksGroupBy.All, content: i18n('value_pdisks-all')},
    ];
}

export function StorageNodesExpertModePanel({className}: StorageNodesExpertModePanelProps) {
    const {
        nodesVdisksGroupBy,
        nodesPdisksGroupBy,
        handleNodesVDisksGroupByChange,
        handleNodesPDisksGroupByChange,
    } = useStorageQueryParams();

    return (
        <ExpertModePanelLayout className={className}>
            <ExpertModeRow
                label={i18n('label_vdisks')}
                value={nodesVdisksGroupBy}
                onUpdate={handleNodesVDisksGroupByChange}
                options={getVDiskOptions()}
                legend={renderVDiskLegend(nodesVdisksGroupBy, 'nodes-vdisks')}
            />
            <ExpertModeRow
                qa="storage-nodes-pdisks-expert-mode"
                label={i18n('label_pdisks')}
                value={nodesPdisksGroupBy}
                onUpdate={handleNodesPDisksGroupByChange}
                options={getPDiskOptions()}
                legend={
                    <div data-qa="storage-nodes-pdisks-expert-mode-legend">
                        {renderPDiskLegend(nodesPdisksGroupBy, 'nodes-pdisks')}
                    </div>
                }
            />
        </ExpertModePanelLayout>
    );
}
