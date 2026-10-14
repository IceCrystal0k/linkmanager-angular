import { buildTree, findItemChildrenIds } from './array-util';

describe('buildTree', () => {
    it('builds nested children, counts direct children, and records ancestors', () => {
        const items = [
            { id: 1, parent_id: null, name: 'Root' },
            { id: 2, parent_id: 1, name: 'Child' },
            { id: 3, parent_id: 2, name: 'Grandchild' },
            { id: 4, parent_id: 1, name: 'Second child' },
            { id: 5, parent_id: null, name: 'Another root' }
        ];

        expect(buildTree(items)).toEqual([
            {
                ...items[0],
                nameIndented: 'Root',
                parentIds: [],
                children: [
                    {
                        ...items[1],
                        nameIndented: '   Child',
                        parentIds: [1],
                        children: [{
                            ...items[2],
                            nameIndented: '      Grandchild',
                            parentIds: [2, 1],
                            children: [],
                            childrenCount: 0
                        }],
                        childrenCount: 1
                    },
                    {
                        ...items[3],
                        nameIndented: '   Second child',
                        parentIds: [1],
                        children: [],
                        childrenCount: 0
                    }
                ],
                childrenCount: 2
            },
            {
                ...items[4],
                nameIndented: 'Another root',
                parentIds: [],
                children: [],
                childrenCount: 0
            }
        ]);
    });

    describe('findItemChildrenIds', () => {
        it('returns all descendants in depth-first input order', () => {
            const items = [
                { id: 1, parent_id: null },
                { id: 2, parent_id: 1 },
                { id: 3, parent_id: 2 },
                { id: 4, parent_id: 1 },
                { id: 5, parent_id: 4 },
                { id: 6, parent_id: null }
            ];

            expect(findItemChildrenIds(items, 1)).toEqual([2, 3, 4, 5]);
        });

        it('handles cycles without revisiting an item', () => {
            const items = [
                { id: 1, parent_id: 3 },
                { id: 2, parent_id: 1 },
                { id: 3, parent_id: 2 }
            ];

            expect(findItemChildrenIds(items, 1)).toEqual([2, 3]);
        });
    });

    it('does not mutate the input items', () => {
        const items = [{ id: 1, parent_id: null, name: 'Root' }];

        buildTree(items);

        expect(items).toEqual([{ id: 1, parent_id: null, name: 'Root' }]);
    });
});
