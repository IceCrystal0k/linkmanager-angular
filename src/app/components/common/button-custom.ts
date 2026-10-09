import { booleanAttribute, Directive, input } from '@angular/core';

@Directive({
    selector: 'button[button-custom]',
    standalone: true,
    host: {
        '[class.button-custom-loading]': 'loading()',
        '[attr.aria-busy]': 'loading()'
    }
})
export class ButtonCustom {
    readonly loading = input(false, { transform: booleanAttribute });
}
