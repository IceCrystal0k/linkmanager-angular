import { Component, input } from '@angular/core';

@Component({
    selector: 'app-spinner-loader',
    standalone: true,
    templateUrl: './spinner-loader.html',
    styleUrl: './spinner-loader.scss'
})
export class SpinnerLoader {
    readonly loading = input(false);
}