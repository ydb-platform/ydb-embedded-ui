import {useState} from 'react';
import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import {Checkbox, RadioButton} from '@gravity-ui/uikit';

import type {VersionToColorMap} from '../../types/versions';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import {getClusterNodes} from '../../store/reducers/clusterNodes/clusterNodes';
import {Loader} from '../../components/Loader';

import {getGroupedStorageNodes, getGroupedTenantNodes, getOtherNodes} from './groupNodes';
import {GroupedNodesTree} from './GroupedNodesTree/GroupedNodesTree';
import {GroupByValue} from './types';

import './Versions.scss';

const b = block('ydb-versions');

interface VersionsProps {
    versionToColor?: VersionToColorMap;
}

export const Versions = ({versionToColor}: VersionsProps) => {
    const dispatch = useDispatch();

    const {nodes = [], loading, wasLoaded} = useTypedSelector((state) => state.clusterNodes);

    useAutofetcher(() => dispatch(getClusterNodes()), [dispatch], true);

    const [groupByValue, setGroupByValue] = useState<GroupByValue>(GroupByValue.VERSION);
    const [expanded, setExpanded] = useState(false);

    const handleGroupByValueChange = (value: string) => {
        setGroupByValue(value as GroupByValue);
    };

    const renderGroupControl = () => {
        return (
            <div className={b('group')}>
                <span className={b('label')}>Group by:</span>
                <RadioButton value={groupByValue} onUpdate={handleGroupByValueChange}>
                    <RadioButton.Option value={GroupByValue.TENANT}>
                        {GroupByValue.TENANT}
                    </RadioButton.Option>
                    <RadioButton.Option value={GroupByValue.VERSION}>
                        {GroupByValue.VERSION}
                    </RadioButton.Option>
                </RadioButton>
            </div>
        );
    };
    const renderControls = () => {
        return (
            <div className={b('controls')}>
                {renderGroupControl()}
                <Checkbox
                    className={b('checkbox')}
                    onChange={() => setExpanded((value) => !value)}
                    checked={expanded}
                >
                    All expanded
                </Checkbox>
            </div>
        );
    };

    if (loading && !wasLoaded) {
        return <Loader />;
    }

    const tenantNodes = getGroupedTenantNodes(nodes, versionToColor, groupByValue);
    const storageNodes = getGroupedStorageNodes(nodes, versionToColor);
    const otherNodes = getOtherNodes(nodes, versionToColor);
    const storageNodesContent = storageNodes?.length ? (
        <>
            <h3>Storage nodes</h3>
            {storageNodes.map(({title, nodes: itemNodes, items, versionColor}) => (
                <GroupedNodesTree
                    key={`storage-nodes-${title}`}
                    title={title}
                    nodes={itemNodes}
                    items={items}
                    versionColor={versionColor}
                />
            ))}
        </>
    ) : null;
    const tenantNodesContent = tenantNodes?.length ? (
        <>
            <h3>Database nodes</h3>
            {renderControls()}
            {tenantNodes.map(({title, nodes: itemNodes, items, versionColor, versionsValues}) => (
                <GroupedNodesTree
                    key={`tenant-nodes-${title}`}
                    title={title}
                    nodes={itemNodes}
                    items={items}
                    expanded={expanded}
                    versionColor={versionColor}
                    versionsValues={versionsValues}
                />
            ))}
        </>
    ) : null;
    const otherNodesContent = otherNodes?.length ? (
        <>
            <h3>Other nodes</h3>
            {otherNodes.map(({title, nodes: itemNodes, items, versionColor, versionsValues}) => (
                <GroupedNodesTree
                    key={`other-nodes-${title}`}
                    title={title}
                    nodes={itemNodes}
                    items={items}
                    versionColor={versionColor}
                    versionsValues={versionsValues}
                />
            ))}
        </>
    ) : null;

    return (
        <div className={b('versions')}>
            {storageNodesContent}
            {tenantNodesContent}
            {otherNodesContent}
        </div>
    );
};
