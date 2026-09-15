import { TestBed } from '@angular/core/testing';
import { UiDialogService } from './ui-dialog';

describe('UiDialogService', () => {
    let service: UiDialogService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UiDialogService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
