import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import {EFlag} from '../../../types/api/enums';
import {isNodeResponseTimedOut} from '../../../utils/nodes';
import {NODE_STATE_UNKNOWN_QA, NodeHostWrapper, getNodeHostPath} from '../NodeHostWrapper';

const TIMEOUT_MESSAGE = 'The node did not respond in time. Its state is unknown.';

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
    test('Should give a path for an available node', () => {
        expect(getNodeHostPath(createNode({SystemState: EFlag.Green}))).toContain('/node/7');
    });

    test('Should give no path for an unavailable node', () => {
        expect(getNodeHostPath(createNode())).toBeUndefined();
        expect(getNodeHostPath(createNode({SystemState: EFlag.Grey}))).toBeUndefined();
    });

    test('Should give a path for a node that only did not answer in time', () => {
        expect(getNodeHostPath(createNode({ResponseTimeout: true}))).toContain('/node/7');
    });

    test('Should give no path without a host even when the node did not answer in time', () => {
        expect(
            getNodeHostPath(createNode({Host: undefined, ResponseTimeout: true})),
        ).toBeUndefined();
    });
});

describe('NodeHostWrapper', () => {
    test('Should show the status and a link for an available node', () => {
        const {container} = renderNode(createNode({SystemState: EFlag.Green}));

        expect(screen.getByRole('link', {name: 'node-7.example.net'})).toBeInTheDocument();
        expect(container.querySelector('.ydb-status-color_state_green')).toBeInTheDocument();
        expect(getStateUnknownIcon(container)).not.toBeInTheDocument();
    });

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
        expect(screen.getByRole('img', {name: TIMEOUT_MESSAGE})).toBe(
            getStateUnknownIcon(container),
        );
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
