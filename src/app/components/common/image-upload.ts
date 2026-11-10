import { Component, output, signal } from '@angular/core';

@Component({
    selector: 'app-image-upload',
    standalone: true,
    templateUrl: './image-upload.html',
    styleUrl: './image-upload.scss'
})
export class ImageUpload {
    readonly isDragging = signal(false);
    readonly error = signal('');
    readonly imageSelected = output<File>();

    private image: File | null = null;
    private dragDepth = 0;

    getImage(): File | null {
        return this.image;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.setImage(input.files?.[0] ?? null);
        input.value = '';
    }

    onDragEnter(event: DragEvent): void {
        event.preventDefault();
        this.dragDepth++;
        this.isDragging.set(true);
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.dragDepth = Math.max(0, this.dragDepth - 1);
        if (this.dragDepth === 0) {
            this.isDragging.set(false);
        }
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragDepth = 0;
        this.isDragging.set(false);
        this.setImage(event.dataTransfer?.files[0] ?? null);
    }

    private setImage(file: File | null): void {
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.image = null;
            this.error.set('Please choose an image file.');
            return;
        }

        this.image = file;
        this.error.set('');
        this.imageSelected.emit(file);
    }
}
