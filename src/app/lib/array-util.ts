export type TreeItem<T> = T & {
    children: TreeItem<T>[];
    childrenCount: number;
    nameIndented?: string; // Optional property for flattened tree representation
    parentIds?: number[];
};

export function buildTree<T extends { id: number; parent_id: number | null; name: string }>(
    items: readonly T[]
): TreeItem<T>[] {
    const childrenByParent = new Map<number | null, T[]>();

    for (const item of items) {
        const siblings = childrenByParent.get(item.parent_id) ?? [];
        siblings.push(item);
        childrenByParent.set(item.parent_id, siblings);
    }

    const buildChildren = (
        parentId: number | null,
        ancestors: number[] = []
    ): TreeItem<T>[] =>
        (childrenByParent.get(parentId) ?? []).map(item => {
            const children = buildChildren(item.id, [...ancestors, item.id]);
            return {
                ...item,
                children,
                childrenCount: children.length,
                nameIndented: `${' '.repeat(ancestors.length * 3)}${item.name}`,
                parentIds: [...ancestors].reverse()
            };
        });

    return buildChildren(null);
}


export function flattenTree<T extends { id: string | number; parent_id: string | number | null, name: string }>(
    tree: TreeItem<T>[], excludeId: number | null = null
): T[] {
    const flattened: T[] = [];
    for (const item of tree) {
        if (item.id === excludeId) {
            continue;
        }
        flattened.push({ ...item});
        if (item.children && item.children.length > 0) {
          flattened.push(...flattenTree(item.children, excludeId));
        }
    }
    return flattened;
}

export function findItemChildrenIds<T extends { id: number; parent_id: number | null;  }>(
    list: T[],
    parentId: number
): number[] {
    const childrenByParent = new Map<number, number[]>();
    // Build a map of parent_id to their children ids
    for (const item of list) {
        if (item.parent_id === null) {
            continue;
        }
        const children = childrenByParent.get(item.parent_id) ?? [];
        children.push(item.id);
        childrenByParent.set(item.parent_id, children);
    }

    const childrenIds: number[] = [];
    const visited = new Set<number>([parentId]);
    // Use a stack to perform depth-first traversal of the tree
    const stack = [...(childrenByParent.get(parentId) ?? [])].reverse();

    // Traverse the tree and collect all children ids
    while (stack.length > 0) {
      // Pop the last element from the stack
      const id = stack.pop()!;
        if (visited.has(id)) {
            continue;
        }
        // Mark the current id as visited and add it to the childrenIds array
        visited.add(id);
        childrenIds.push(id);
        // Get the children of the current id and push them onto the stack in reverse order
        const children = childrenByParent.get(id) ?? [];
        for (let index = children.length - 1; index >= 0; index--) {
            stack.push(children[index]);
        }
    }

    return childrenIds;
}
