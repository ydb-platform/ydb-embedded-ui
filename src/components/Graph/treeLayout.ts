import type {TBlock, TConnection} from '@gravity-ui/graph';

import type {ExtendedTBlock, LayoutOptions, TreeNode} from './types';
import {prepareBlocks, prepareConnections} from './utils';

class TreeLayoutEngine {
    private blocks: Map<string, any>;
    private connections: TConnection[];
    private options: Required<LayoutOptions>;
    private tree: TreeNode | null;
    private levels: TreeNode[][];

    constructor(blocks: any[], connections: TConnection[], options: LayoutOptions = {}) {
        this.blocks = new Map(blocks.map((block: any) => [block.id, {...block}]));
        this.connections = connections;

        // Layout settings
        this.options = {
            horizontalSpacing: options.horizontalSpacing || 40, // horizontal distance between blocks
            verticalSpacing: options.verticalSpacing || 20, // vertical distance between levels
            ...options,
        };

        this.tree = null;
        this.levels = [];
    }

    // Building a tree structure
    buildTree() {
        const childrenMap = new Map();
        const parentMap = new Map();

        for (const block of this.blocks.values()) {
            childrenMap.set(block.id, []);
        }

        // Setting connections
        for (const connection of this.connections) {
            const parent = connection.sourceBlockId;
            const child = connection.targetBlockId;

            childrenMap.get(parent).push(child);
            parentMap.set(child, parent);
        }

        // Find root (a node without a parent)
        const rootId = Array.from(this.blocks.keys()).find((id) => !parentMap.has(id));

        if (!rootId) {
            throw new Error('Root node not found');
        }

        // Recursively building a tree
        const buildNode = (nodeId: string, level = 0): TreeNode => {
            const block = this.blocks.get(nodeId);
            const children = childrenMap
                .get(nodeId)
                .map((childId: string) => buildNode(childId, level + 1));

            return {
                id: nodeId,
                block: block,
                children: children,
                level: level,
                x: 0,
                y: 0,
                subtreeWidth: 0,
            };
        };

        this.tree = buildNode(rootId);
        return this.tree;
    }

    // Grouping nodes by levels
    groupByLevels(node: TreeNode | null = this.tree, levels: TreeNode[][] = []): TreeNode[][] {
        if (!node) {
            return levels;
        }

        if (!levels[node.level]) {
            levels[node.level] = [];
        }
        levels[node.level].push(node);

        for (const child of node.children) {
            this.groupByLevels(child, levels);
        }

        this.levels = levels;
        return levels;
    }

    // Calculating the width of the subtree for each node
    calculateSubtreeWidths(node: TreeNode = this.tree!): number {
        if (node.children.length === 0) {
            // Leaf node - width is equal to the width of the block
            node.subtreeWidth = node.block.width;
        } else {
            // Recursively calculating the width for children
            for (const child of node.children) {
                this.calculateSubtreeWidths(child);
            }

            // Subtree width = sum of the widths of the children's subtrees + the margins between them
            const childrenWidth = node.children.reduce(
                (sum: number, child: TreeNode) => sum + child.subtreeWidth,
                0,
            );
            const spacingWidth = (node.children.length - 1) * this.options.horizontalSpacing;
            const totalChildrenWidth = childrenWidth + spacingWidth;

            // Subtree width = the maximum of the width of the node itself and the total width of the children
            node.subtreeWidth = Math.max(node.block.width, totalChildrenWidth);
        }

        return node.subtreeWidth;
    }

    // Placement of nodes by position
    positionNodes() {
        if (!this.tree) {
            return;
        }

        // Calculating the Y coordinates for each level
        let currentY = 0;
        const levelY: number[] = [];

        for (let level = 0; level < this.levels.length; level++) {
            levelY[level] = currentY;

            // We find the maximum height of the blocks at this level
            const maxHeight = Math.max(
                ...this.levels[level].map((node: TreeNode) => node.block.height),
            );
            currentY += maxHeight + this.options.verticalSpacing;
        }

        // Recursively placing nodes
        const positionNode = (node: TreeNode, leftX: number): void => {
            // Setting the Y coordinate
            node.y = levelY[node.level];

            if (node.children.length === 0) {
                // The leaf node is placed in the current position.
                node.x = leftX;
            } else {
                // Place children
                let childX = leftX;

                // If the node width is greater than the total width of the children, add an indentation.
                const childrenWidth = node.children.reduce(
                    (sum: number, child: TreeNode) => sum + child.subtreeWidth,
                    0,
                );
                const spacingWidth = (node.children.length - 1) * this.options.horizontalSpacing;
                const totalChildrenWidth = childrenWidth + spacingWidth;

                if (node.block.width > totalChildrenWidth) {
                    const extraSpace = (node.block.width - totalChildrenWidth) / 2;
                    childX += extraSpace;
                }

                // Place each child
                for (const child of node.children) {
                    positionNode(child, childX);
                    childX += child.subtreeWidth + this.options.horizontalSpacing;
                }

                // Center the parent node relative to the children
                const firstChild = node.children[0];
                const lastChild = node.children[node.children.length - 1];
                const childrenCenter = (firstChild.x + lastChild.x + lastChild.block.width) / 2;
                node.x = childrenCenter - node.block.width / 2;
            }
        };

        positionNode(this.tree, 0);
    }

    // Normalization of coordinates (so that the minimum coordinates are >= 0)
    normalizeCoordinates() {
        if (!this.tree) {
            return;
        }

        const allNodes: TreeNode[] = [];

        const collectNodes = (node: TreeNode) => {
            allNodes.push(node);
            for (const child of node.children) {
                collectNodes(child);
            }
        };

        collectNodes(this.tree);

        const minX = Math.min(...allNodes.map((node) => node.x));
        const minY = Math.min(...allNodes.map((node) => node.y));

        // Shift all coordinates so that the minimum ones are equal to 0
        const offsetX = minX < 0 ? -minX : 0;
        const offsetY = minY < 0 ? -minY : 0;

        for (const node of allNodes) {
            node.x += offsetX;
            node.y += offsetY;
        }
    }

    // Main method of composition
    layout() {
        this.buildTree();
        this.groupByLevels();
        this.calculateSubtreeWidths();
        this.positionNodes();
        this.normalizeCoordinates();

        return this.getLayoutResult();
    }

    // Getting the result of composition
    getLayoutResult(): ExtendedTBlock[] {
        if (!this.tree) {
            return [];
        }

        const result: ExtendedTBlock[] = [];

        const collectResults = (node: TreeNode) => {
            result.push({
                id: node.id,
                x: node.x,
                y: node.y,
                width: node.block.width,
                height: node.block.height,
                level: node.level,
                ...node.block,
            });

            for (const child of node.children) {
                collectResults(child);
            }
        };

        collectResults(this.tree);

        return result;
    }
}

// Function for using the algorithm
function calculateTreeLayout(blocks: TBlock[], connections: TConnection[], options = {}) {
    const engine = new TreeLayoutEngine(blocks, connections, options);
    return engine.layout();
}

function calculateTreeEdges(layoutResult: ExtendedTBlock[], connections: TConnection[]) {
    // Create a position map for convenience of search
    const positionMap = new Map(layoutResult.map((item) => [item.id, item]));

    // Group connections by parent block
    const connectionsByParent = new Map();

    for (const connection of connections) {
        const parentId = connection.sourceBlockId;
        if (!connectionsByParent.has(parentId)) {
            connectionsByParent.set(parentId, []);
        }
        connectionsByParent.get(parentId).push(connection);
    }

    const connectionPaths: {
        connectionId: string | undefined;
        sourceBlockId: string | number;
        targetBlockId: string | number;
        points: {x: number; y: number}[];
    }[] = [];

    // For each parent block, we calculate the paths to the children
    for (const [parentId, parentConnections] of connectionsByParent) {
        const parent = positionMap.get(parentId);
        if (!parent) {
            continue;
        }

        // Coordinates of the initial point (center of the lower part of the parent)
        const startX = parent.x + parent.width / 2;
        const startY = parent.y + parent.height;

        if (parentConnections.length === 1) {
            // One child block - simple straight line
            const connection = parentConnections[0];
            const child = positionMap.get(connection.targetBlockId);

            if (child) {
                const endX = child.x + child.width / 2;
                const endY = child.y;

                connectionPaths.push({
                    connectionId: connection.id,
                    sourceBlockId: connection.sourceBlockId,
                    targetBlockId: connection.targetBlockId,
                    points: [
                        {x: startX, y: startY},
                        {x: endX, y: endY},
                    ],
                });
            }
        } else {
            // Several child blocks - broken lines

            // We find the vertical distance between the parent and the nearest child
            const children = parentConnections
                .map((conn: TConnection) => positionMap.get(conn.targetBlockId))
                .filter(
                    (child: ExtendedTBlock | undefined): child is ExtendedTBlock =>
                        child !== undefined,
                );

            if (children.length === 0) {
                continue;
            }

            // We find the minimum distance to the children by Y
            const minChildY = Math.min(...children.map((child: ExtendedTBlock) => child.y));

            // The point of branching - in the middle between the parent and the children
            const branchY = startY + (minChildY - startY) / 2;

            // For each child block, we create a broken line
            for (const connection of parentConnections) {
                const child = positionMap.get(connection.targetBlockId);
                if (!child) {
                    continue;
                }

                const endX = child.x + child.width / 2;
                const endY = child.y;

                const points = [
                    {x: startX, y: startY}, // Start - center of the lower part of the parent
                    {x: startX, y: branchY}, // Vertically down to the point of branching
                    {x: endX, y: branchY}, // Horizontally to the center of the child block
                    {x: endX, y: endY}, // Vertically down to the center of the upper part of the child block
                ];

                connectionPaths.push({
                    connectionId: connection.id,
                    sourceBlockId: connection.sourceBlockId,
                    targetBlockId: connection.targetBlockId,
                    points: points,
                });
            }
        }
    }

    return connectionPaths;
}

onmessage = function (e) {
    const {nodes, links} = e.data;
    const blocks = prepareBlocks(nodes);
    const connections = prepareConnections(links);
    const layout = calculateTreeLayout(blocks, connections);
    const edges = calculateTreeEdges(layout, connections);

    postMessage({
        layout,
        edges,
    });
};
