import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {EFlag} from '../../../types/api/enums';
import {isNodeResponseTimedOut} from '../../../utils/nodes';
import {NODE_STATE_UNKNOWN_QA, NodeHostWrapper, getNodeHostPath} from '../NodeHostWrapper';

function createNode(node: Partial<PreparedStorageNode> = {}): PreparedStorageNode {
    return {
        NodeId: 7,
        Host: 'node-7.example.net',
        Missing: 0,
        MaximumSlotsPerDisk: 1,
        MaximumDisksPerNode: 1,
        ...node,
    };
}

function renderNode(node: PreparedStorageNode, statusForIcon?: 'SystemState' | 'ConnectStatus') {
    return render(
        <MemoryRouter>
            <NodeHostWrapper node={node} statusForIcon={statusForIcon} />
        </MemoryRouter>,
    );
}

function getStateUnknownIcon(container: HTMLElement) {
    return container.querySelector(`[data-qa="${NODE_STATE_UNKNOWN_QA}"]`);
}

describe('isNodeResponseTimedOut', () => {
    test.each<[string, Partial<PreparedStorageNode>, boolean]>([
        ['no state and the flag', {ResponseTimeout: true}, true],
        ['grey state and the flag', {SystemState: EFlag.Grey, ResponseTimeout: true}, true],
        ['no state without the flag (older backends)', {}, false],
        ['no state and the flag turned off', {ResponseTimeout: false}, false],
        // The state has arrived, so the flag is stale
        ['a known state with the flag', {SystemState: EFlag.Green, ResponseTimeout: true}, false],
    ])('Should handle %s', (_name, node, expected) => {
        expect(isNodeResponseTimedOut(createNode(node))).toBe(expected);
    });
});

describe('getNodeHostPath', () => {
    test('Should give no path for an unavailable node', () => {
        expect(getNodeHostPath(createNode())).toBeUndefined();
        expect(getNodeHostPath(createNode({SystemState: EFlag.Grey}))).toBeUndefined();
    });

    test('Should treat a node without a state as a storage node in a table of storage nodes', () => {
        const path = getNodeHostPath(createNode({ResponseTimeout: true}), '/Root/db', {
            storageNodes: true,
        });

        // like an available storage node: its own storage tab and no database in the link
        expect(path).toBe(
            getNodeHostPath(createNode({SystemState: EFlag.Green, Roles: ['Storage']}), '/Root/db'),
        );
        expect(path).toContain('/node/7/storage');
        expect(path).not.toContain('database');
    });

    test('Should treat a node without a state as a database node among the nodes of a database', () => {
        const path = getNodeHostPath(createNode({ResponseTimeout: true}), '/Root/db');

        // like an available node of the database: its tablets and the database in the link
        expect(path).toBe(
            getNodeHostPath(
                createNode({SystemState: EFlag.Green, TenantName: '/Root/db'}),
                '/Root/db',
            ),
        );
        expect(path).toContain('/node/7/tablets');
        expect(path).toContain('database=');
    });

    test('Should not let the table override the roles a node has reported', () => {
        const node = createNode({SystemState: EFlag.Green, TenantName: '/Root/db'});

        expect(getNodeHostPath(node, '/Root/db', {storageNodes: true})).toBe(
            getNodeHostPath(node, '/Root/db'),
        );
    });

    test('Should give no path without a host even when the node did not answer in time', () => {
        expect(
            getNodeHostPath(createNode({Host: undefined, ResponseTimeout: true})),
        ).toBeUndefined();
    });
});

describe('NodeHostWrapper', () => {
    test('Should show the grey status and no link for an unavailable node', () => {
        const {container} = renderNode(createNode());

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByText('node-7.example.net')).toBeInTheDocument();
        expect(container.querySelector('.ydb-status-color_state_grey')).toBeInTheDocument();
        expect(getStateUnknownIcon(container)).not.toBeInTheDocument();
    });

    test('Should show the question icon and keep the link when the node did not answer in time', () => {
        const {container} = renderNode(createNode({ResponseTimeout: true}));

        expect(screen.getByRole('link', {name: 'node-7.example.net'})).toHaveAttribute(
            'href',
            expect.stringContaining('/node/7'),
        );
        expect(getStateUnknownIcon(container)).toBeInTheDocument();
        expect(container.querySelector('.ydb-status-color')).not.toBeInTheDocument();
    });

    test('Should keep the connect status but still give the link in the network column', () => {
        const {container} = renderNode(
            createNode({ResponseTimeout: true, ConnectStatus: EFlag.Yellow}),
            'ConnectStatus',
        );

        expect(screen.getByRole('link', {name: 'node-7.example.net'})).toBeInTheDocument();
        expect(container.querySelector('.ydb-status-color_state_yellow')).toBeInTheDocument();
        expect(getStateUnknownIcon(container)).not.toBeInTheDocument();
    });
});
