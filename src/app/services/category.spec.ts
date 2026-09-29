import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoryModel, CategoryService } from './category';
import ServiceConfig from './service.config';

describe('CategoryService', () => {
    let service: CategoryService;
    let httpTestingController: HttpTestingController;

    const existingCategory: CategoryModel = {
        id: 'existing',
        module_id: 'links',
        name: 'Existing category',
        slug: 'existing-category',
        parent_id: null,
        order_index: 0,
        description: 'An existing category'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(CategoryService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    const loadCategories = (categories: CategoryModel[]) => {
        service.fetchItems().subscribe();
        httpTestingController.expectOne(ServiceConfig.apiUrl).flush(categories);
    };

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set categories after fetching them', () => {
        service.fetchItems().subscribe();

        const request = httpTestingController.expectOne(ServiceConfig.apiUrl);
        expect(request.request.method).toBe('GET');
        request.flush([existingCategory]);

        expect(service.categories()).toEqual([existingCategory]);
    });

    it('should add a category after creating it', () => {
        loadCategories([existingCategory]);
        const newCategory: CategoryModel = {
            id: 'created',
            module_id: 'links',
            name: 'Created category',
            slug: 'created-category',
            parent_id: null,
            order_index: 1,
            description: 'A created category'
        };

        service.createItem(newCategory).subscribe();

        const request = httpTestingController.expectOne(ServiceConfig.apiUrl);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(newCategory);
        request.flush(newCategory);

        expect(service.categories()).toEqual([existingCategory, newCategory]);
    });

    it('should update a category after saving it', () => {
        loadCategories([existingCategory]);
        const updatedCategory = { ...existingCategory, name: 'Updated category' };

        service.updateItem(existingCategory.id, { name: updatedCategory.name }).subscribe();

        const request = httpTestingController.expectOne(`${ServiceConfig.apiUrl}/${existingCategory.id}`);
        expect(request.request.method).toBe('PUT');
        console.log('Request body:', request.request.body, updatedCategory.name); // Debugging line
        expect(request.request.body).toEqual({ name: updatedCategory.name });
        request.flush(updatedCategory);

        console.log(service.categories());
        expect(service.categories()).toEqual([updatedCategory]);
    });

    it('should remove a category after deleting it', () => {
        loadCategories([existingCategory]);

        service.deleteItem(existingCategory.id).subscribe();

        const request = httpTestingController.expectOne(`${ServiceConfig.apiUrl}/${existingCategory.id}`);
        expect(request.request.method).toBe('DELETE');
        request.flush(null);

        expect(service.categories()).toEqual([]);
    });
});
