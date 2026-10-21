import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryList } from './category-list';

describe('CategoryList', () => {
    let component: CategoryList;
    let fixture: ComponentFixture<CategoryList>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CategoryList]
        }).compileComponents();

        fixture = TestBed.createComponent(CategoryList);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('filters after two characters and retains ancestors of matching categories', () => {
        fixture.componentRef.setInput('module', {
            id: 1,
            name: 'Work',
            slug: 'work',
            icon: 'folder',
            order_index: 1,
            description: '',
            enabled: true
        });
        fixture.componentRef.setInput('categoryTreeData', [
            {
                id: 1,
                name: 'Projects',
                module_id: 1,
                children: [
                    {
                        id: 2,
                        name: 'Documents',
                        module_id: 1,
                        children: [{ id: 3, name: 'Design docs', module_id: 1 }]
                    },
                    { id: 4, name: 'Meetings', module_id: 1 }
                ]
            },
            { id: 5, name: 'Personal', module_id: 1 }
        ]);

        component.filterText.set('d');
        expect(component.categoryTree().map((category) => category.id)).toEqual([1, 5]);

        component.filterText.set('do');
        const filteredTree = component.categoryTree();
        expect(filteredTree.map((category) => category.id)).toEqual([1]);
        expect(filteredTree[0].children?.map((category) => category.id)).toEqual([2]);
        expect(filteredTree[0].children?.[0].children?.map((category) => category.id)).toEqual([3]);
    });

    it('highlights every case-insensitive match in a category name', () => {
        component.filterText.set('do');

        expect(component.getCategoryNameParts('Documents and docs')).toEqual([
            { text: 'Do', highlighted: true },
            { text: 'cuments and ', highlighted: false },
            { text: 'do', highlighted: true },
            { text: 'cs', highlighted: false }
        ]);
    });

    it('updates the selected category styling when the selected id changes', () => {
        fixture.componentRef.setInput('module', {
            id: 1,
            name: 'Work',
            slug: 'work',
            icon: 'folder',
            order_index: 1,
            description: '',
            enabled: true
        });
        fixture.componentRef.setInput('categoryTreeData', [
            { id: 1, name: 'Projects', module_id: 1 },
            { id: 2, name: 'Documents', module_id: 1 }
        ]);
        fixture.componentRef.setInput('selectedCategoryId', 1);
        fixture.detectChanges();

        let nodes = fixture.nativeElement.querySelectorAll('mat-tree-node');
        expect(nodes[0].classList).toContain('bg-tree-selected');
        expect(nodes[1].classList).not.toContain('bg-tree-selected');

        fixture.componentRef.setInput('selectedCategoryId', 2);
        fixture.detectChanges();

        nodes = fixture.nativeElement.querySelectorAll('mat-tree-node');
        expect(nodes[0].classList).not.toContain('bg-tree-selected');
        expect(nodes[1].classList).toContain('bg-tree-selected');
    });
});
