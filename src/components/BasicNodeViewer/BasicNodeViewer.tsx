import cn from 'bem-cn-lite';

import type {AdditionalNodesProps} from '../../types/additionalProps';
import type {PreparedNode} from '../../store/reducers/node/types';

import {EntityStatus} from '../EntityStatus/EntityStatus';
import {Tags} from '../Tags';
import {Icon} from '../Icon';

import './BasicNodeViewer.scss';

const b = cn('basic-node-viewer');

interface BasicNodeViewerProps {
    node: PreparedNode;
    additionalNodesProps?: AdditionalNodesProps;
    className?: string;
}

export const BasicNodeViewer = ({node, additionalNodesProps, className}: BasicNodeViewerProps) => {
    const nodeHref = additionalNodesProps?.getNodeRef
        ? additionalNodesProps.getNodeRef(node) + 'internal'
        : undefined;

    return (
        <div className={b(null, className)}>
            {node ? (
                <>
                    <div className={b('title')}>Node</div>
                    <EntityStatus status={node.SystemState} name={node.Host} />
                    {nodeHref && (
                        <a
                            rel="noopener noreferrer"
                            className={b('link', {external: true})}
                            href={nodeHref}
                            target="_blank"
                        >
                            <Icon name="external" />
                        </a>
                    )}

                    <div className={b('id')}>
                        <label className={b('label')}>NodeID</label>
                        <label>{node.NodeId}</label>
                    </div>

                    {node.DC && <Tags tags={[node.DC]} />}
                    {node.Roles && <Tags tags={node.Roles} tagsType="blue" />}
                </>
            ) : (
                <div className="error">no data</div>
            )}
        </div>
    );
};
