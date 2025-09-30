import React from 'react';

import {ArrowRight, ChevronDown, ChevronUp, Database} from '@gravity-ui/icons';
import {Button, ClipboardButton, Flex, Icon, Text} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {VersionsBar} from '../../../components/VersionsBar/VersionsBar';
import {cn} from '../../../utils/cn';
import type {PreparedNodeSystemState} from '../../../utils/nodes';
import type {PreparedVersion} from '../../../utils/versions/types';
import {getTenantPath} from '../../Tenant/TenantPages';
import i18n from '../i18n';
import type {GroupedNodesItem} from '../types';

import './NodesTreeTitle.scss';

const b = cn('ydb-versions-nodes-tree-title');

interface NodesTreeTitleProps {
    title?: string;
    isDatabase?: boolean;
    expanded?: boolean;
    nodes?: PreparedNodeSystemState[];
    items?: GroupedNodesItem[];
    versionColor?: string;
    preparedVersions?: PreparedVersion[];
    onClick?: () => void;
}

export const NodesTreeTitle = ({
    title,
    isDatabase,
    expanded,
    nodes,
    items,
    versionColor,
    preparedVersions,
    onClick,
}: NodesTreeTitleProps) => {
    const history = useHistory();

    const handleClick = React.useCallback<React.MouseEventHandler<HTMLDivElement>>(
        (event) => {
            const shouldSkip = event.nativeEvent.composedPath().some(isActiveButtonTarget);

            if (!shouldSkip) {
                onClick?.();
            }
        },
        [onClick],
    );

    const nodesAmount = React.useMemo(() => {
        if (items) {
            return items.reduce((acc, curr) => {
                if (!curr.nodes) {
                    return acc;
                }
                return acc + curr.nodes.length;
            }, 0);
        } else {
            return nodes ? nodes.length : 0;
        }
    }, [items, nodes]);

    const renderNodesCount = () => {
        if (isDatabase) {
            return (
                <Button
                    size="s"
                    onClick={() =>
                        history.push(getTenantPath({database: title, diagnosticsTab: 'nodes'}))
                    }
                >
                    {i18n('nodes-count', {count: nodesAmount})}
                    <Icon data={ArrowRight} />
                </Button>
            );
        }

        return (
            <Text variant="body-2" color="hint">
                {i18n('nodes-count', {count: nodesAmount})}
            </Text>
        );
    };

    return (
        <div className={b('overview')} onClick={handleClick}>
            <Flex gap={2} alignItems={'center'}>
                {versionColor && !isDatabase ? (
                    <div className={b('version-color')} style={{background: versionColor}} />
                ) : null}
                {isDatabase ? <Icon data={Database} /> : null}
                {title ? (
                    <React.Fragment>
                        {title}
                        <ClipboardButton
                            text={title}
                            size="s"
                            className={b('clipboard-button')}
                            view="flat"
                        />
                    </React.Fragment>
                ) : null}
                {renderNodesCount()}
            </Flex>
            <Flex alignItems={'center'} gap={4}>
                {isDatabase && preparedVersions ? (
                    <div className={b('version-progress')}>
                        <VersionsBar preparedVersions={preparedVersions} withTitles={false} />
                    </div>
                ) : null}
                <Icon className={b('icon')} data={expanded ? ChevronUp : ChevronDown} />
            </Flex>
        </div>
    );
};

function isActiveButtonTarget(target: EventTarget) {
    return (
        target instanceof HTMLElement &&
        ((target.nodeName === 'BUTTON' &&
            !target.hasAttribute('disabled') &&
            target.getAttribute('aria-disabled') !== 'true') ||
            (target.hasAttribute('tabindex') && target.tabIndex > -1))
    );
}
