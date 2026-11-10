import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUpload } from './image-upload';

describe('ImageUpload', () => {
    let component: ImageUpload;
    let fixture: ComponentFixture<ImageUpload>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ImageUpload]
        }).compileComponents();

        fixture = TestBed.createComponent(ImageUpload);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('returns the selected image', () => {
        const image = new File(['image data'], 'avatar.png', { type: 'image/png' });
        const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
        Object.defineProperty(input, 'files', { configurable: true, value: [image] });

        input.dispatchEvent(new Event('change'));

        expect(component.getImage()).toBe(image);
    });

    it('rejects non-image files', () => {
        const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
        const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
        Object.defineProperty(input, 'files', { configurable: true, value: [file] });

        input.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        expect(component.getImage()).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Please choose an image file.');
    });
});
