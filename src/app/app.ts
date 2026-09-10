import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet], // Make sure RouterOutlet is imported here!
    template: `<router-outlet></router-outlet>` // Inline template to render the active route component
})
export class App {}
