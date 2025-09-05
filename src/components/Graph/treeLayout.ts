class TreeLayoutEngine {
    constructor(blocks, connections, options = {}) {
        this.blocks = new Map(blocks.map((block) => [block.id, {...block}]));
        this.connections = connections;

        // Настройки отступов
        this.options = {
            horizontalSpacing: options.horizontalSpacing || 40, // расстояние между блоками по горизонтали
            verticalSpacing: options.verticalSpacing || 20, // расстояние между уровнями
            ...options,
        };

        this.tree = null;
        this.levels = [];
    }

    // Построение структуры дерева
    buildTree() {
        // Создаем карты родителей и детей
        const childrenMap = new Map();
        const parentMap = new Map();

        // Инициализируем карты
        for (const block of this.blocks.values()) {
            childrenMap.set(block.id, []);
        }

        // Заполняем связи
        for (const connection of this.connections) {
            const parent = connection.sourceBlockId;
            const child = connection.targetBlockId;

            childrenMap.get(parent).push(child);
            parentMap.set(child, parent);
        }

        // Находим корневой узел (узел без родителя)
        const rootId = Array.from(this.blocks.keys()).find((id) => !parentMap.has(id));

        if (!rootId) {
            throw new Error('Root node not found');
        }

        // Рекурсивно строим дерево
        const buildNode = (nodeId, level = 0) => {
            const block = this.blocks.get(nodeId);
            const children = childrenMap
                .get(nodeId)
                .map((childId) => buildNode(childId, level + 1));

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

    // Группировка узлов по уровням
    groupByLevels(node = this.tree, levels = []) {
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

    // Вычисление ширины поддерева для каждого узла
    calculateSubtreeWidths(node = this.tree) {
        if (node.children.length === 0) {
            // Листовой узел - ширина равна ширине блока
            node.subtreeWidth = node.block.width;
        } else {
            // Рекурсивно вычисляем ширину для детей
            for (const child of node.children) {
                this.calculateSubtreeWidths(child);
            }

            // Ширина поддерева = сумма ширин поддеревьев детей + отступы между ними
            const childrenWidth = node.children.reduce((sum, child) => sum + child.subtreeWidth, 0);
            const spacingWidth = (node.children.length - 1) * this.options.horizontalSpacing;
            const totalChildrenWidth = childrenWidth + spacingWidth;

            // Ширина поддерева = максимум из ширины самого узла и суммарной ширины детей
            node.subtreeWidth = Math.max(node.block.width, totalChildrenWidth);
        }

        return node.subtreeWidth;
    }

    // Размещение узлов по позициям
    positionNodes() {
        // Вычисляем Y координаты для каждого уровня
        let currentY = 0;
        const levelY = [];

        for (let level = 0; level < this.levels.length; level++) {
            levelY[level] = currentY;

            // Находим максимальную высоту блоков на этом уровне
            const maxHeight = Math.max(...this.levels[level].map((node) => node.block.height));
            currentY += maxHeight + this.options.verticalSpacing;
        }

        // Рекурсивно размещаем узлы
        const positionNode = (node, leftX) => {
            // Устанавливаем Y координату
            node.y = levelY[node.level];

            if (node.children.length === 0) {
                // Листовой узел - размещаем в текущей позиции
                node.x = leftX;
            } else {
                // Размещаем детей
                let childX = leftX;

                // Если ширина узла больше суммарной ширины детей, добавляем отступ
                const childrenWidth = node.children.reduce(
                    (sum, child) => sum + child.subtreeWidth,
                    0,
                );
                const spacingWidth = (node.children.length - 1) * this.options.horizontalSpacing;
                const totalChildrenWidth = childrenWidth + spacingWidth;

                if (node.block.width > totalChildrenWidth) {
                    const extraSpace = (node.block.width - totalChildrenWidth) / 2;
                    childX += extraSpace;
                }

                // Размещаем каждого ребенка
                for (const child of node.children) {
                    positionNode(child, childX);
                    childX += child.subtreeWidth + this.options.horizontalSpacing;
                }

                // Центрируем родительский узел относительно детей
                const firstChild = node.children[0];
                const lastChild = node.children[node.children.length - 1];
                const childrenCenter = (firstChild.x + lastChild.x + lastChild.block.width) / 2;
                node.x = childrenCenter - node.block.width / 2;
            }
        };

        positionNode(this.tree, 0);
    }

    // Нормализация координат (чтобы минимальные координаты были >= 0)
    normalizeCoordinates() {
        const allNodes = [];

        const collectNodes = (node) => {
            allNodes.push(node);
            for (const child of node.children) {
                collectNodes(child);
            }
        };

        collectNodes(this.tree);

        const minX = Math.min(...allNodes.map((node) => node.x));
        const minY = Math.min(...allNodes.map((node) => node.y));

        // Сдвигаем все координаты так, чтобы минимальные были равны 0
        const offsetX = minX < 0 ? -minX : 0;
        const offsetY = minY < 0 ? -minY : 0;

        for (const node of allNodes) {
            node.x += offsetX;
            node.y += offsetY;
        }
    }

    // Основной метод компоновки
    layout() {
        this.buildTree();
        this.groupByLevels();
        this.calculateSubtreeWidths();
        this.positionNodes();
        this.normalizeCoordinates();

        return this.getLayoutResult();
    }

    // Получение результата компоновки
    getLayoutResult() {
        const result = [];

        const collectResults = (node) => {
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

// Функция для использования алгоритма
export function calculateTreeLayout(blocks, connections, options = {}) {
    const engine = new TreeLayoutEngine(blocks, connections, options);
    return engine.layout();
}

export function calculateConnectionPaths(layoutResult, connections) {
    // Создаем карту позиций для удобства поиска
    const positionMap = new Map(layoutResult.map((item) => [item.id, item]));

    // Группируем связи по родительскому блоку
    const connectionsByParent = new Map();

    for (const connection of connections) {
        const parentId = connection.sourceBlockId;
        if (!connectionsByParent.has(parentId)) {
            connectionsByParent.set(parentId, []);
        }
        connectionsByParent.get(parentId).push(connection);
    }

    const connectionPaths = [];

    // Для каждого родительского блока рассчитываем пути к детям
    for (const [parentId, parentConnections] of connectionsByParent) {
        const parent = positionMap.get(parentId);
        if (!parent) continue;

        // Координаты начальной точки (центр нижней части родителя)
        const startX = parent.x + parent.width / 2;
        const startY = parent.y + parent.height;

        if (parentConnections.length === 1) {
            // Один дочерний блок - простая прямая линия
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
            // Несколько дочерних блоков - ломаные линии

            // Находим вертикальное расстояние между родителем и ближайшим ребенком
            const children = parentConnections
                .map((conn) => positionMap.get(conn.targetBlockId))
                .filter((child) => child !== undefined);

            if (children.length === 0) continue;

            // Находим минимальное расстояние до детей по Y
            const minChildY = Math.min(...children.map((child) => child.y));

            // Точка разветвления - посередине между родителем и детьми
            const branchY = startY + (minChildY - startY) / 2;

            // Для каждого дочернего блока создаем ломаную линию
            for (const connection of parentConnections) {
                const child = positionMap.get(connection.targetBlockId);
                if (!child) continue;

                const endX = child.x + child.width / 2;
                const endY = child.y;

                const points = [
                    {x: startX, y: startY}, // Начало - центр нижней части родителя
                    {x: startX, y: branchY}, // Вертикально вниз до точки разветвления
                    {x: endX, y: branchY}, // Горизонтально до центра дочернего блока
                    {x: endX, y: endY}, // Вертикально вниз до центра верхней части дочернего блока
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
