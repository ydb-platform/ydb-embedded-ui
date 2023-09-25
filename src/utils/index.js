// determine how many nodes have status Connected "true"
export const getConnectedNodesCount = (nodeStateInfo) => {
    return nodeStateInfo?.reduce((acc, item) => (item.Connected ? acc + 1 : acc), 0);
};

export const renderExplainNode = (node) => {
    const parts = node.name.split('|');
    return parts.length > 1 ? parts[1] : node.name;
};
