import { Component, computed, input } from '@angular/core';

interface HighlightedPart {
    text: string;
    highlighted: boolean;
}

@Component({
    selector: 'app-highlighted-text',
    standalone: true,
    templateUrl: './highlighted-text.html'
})
export class HighlightedText {
    readonly text = input.required<string>();
    readonly parts = computed(() => this.parse(this.text()));

    private parse(text: string): HighlightedPart[] {
        const parts: HighlightedPart[] = [];
        const markdownPattern = /\*\*(.+?)\*\*/g;
        let lastIndex = 0;

        for (const match of text.matchAll(markdownPattern)) {
            const matchIndex = match.index ?? 0;

            if (matchIndex > lastIndex) {
                parts.push({
                    text: text.slice(lastIndex, matchIndex),
                    highlighted: false
                });
            }

            parts.push({
                text: match[1],
                highlighted: true
            });
            lastIndex = matchIndex + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push({
                text: text.slice(lastIndex),
                highlighted: false
            });
        }

        return parts;
    }
}
