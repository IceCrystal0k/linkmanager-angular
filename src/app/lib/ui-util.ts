/**
 * get expanded node ids from the material tree
 * @param nodes material tree nodes
 * @param matTree material tree instance
 * @returns a set with the expanded node ids
 */
export function getExpandedNodeIds(nodes: any[], matTree: any): Set<number> {
    if (!matTree) {
        return new Set<number>();
    }
    const expandedNodeIds = new Set<number>();

    const collectExpandedNodes = (currentNodes: any[]) => {
        for (const node of currentNodes) {
            if (node.id && matTree?.isExpanded(node)) {
                expandedNodeIds.add(node.id);
            }

            if (node.children) {
                collectExpandedNodes(node.children);
            }
        }
    };

    collectExpandedNodes(nodes);
    return expandedNodeIds;
}

/**
 * restore expanded nodes in the material tree
 * @param nodes material tree nodes
 * @param expandedNodeIds expanded node ids to restore
 * @param matTree material tree instance
 * @returns
 */
export function restoreExpandedNodes(nodes: any[], expandedNodeIds: Set<number>, matTree: any): void {
    if (!matTree) {
        return;
    }

    const expandMatchingNodes = (nodes: any[]) => {
        for (const node of nodes) {
            if (node.id && expandedNodeIds.has(node.id)) {
                matTree?.expand(node);
            }

            if (node.children) {
                expandMatchingNodes(node.children);
            }
        }
    };

    expandMatchingNodes(nodes);
}
