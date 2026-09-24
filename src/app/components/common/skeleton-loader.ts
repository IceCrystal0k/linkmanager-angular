import { Component, input } from '@angular/core';

@Component({
    selector: 'app-skeleton-loader',
    standalone: true,
    templateUrl: './skeleton-loader.html',
    styleUrl: './skeleton-loader.scss'
})
export class SkeletonLoader {
    readonly loading = input(false);
    readonly skeletonItems = [0, 1, 2, 3];
}