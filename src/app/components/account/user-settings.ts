import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TooltipPosition, MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-user-settings',
    templateUrl: './user-settings.html',
    imports: [ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSelectModule]
})
export class UserSettings {
  private fb = inject(FormBuilder);
  dateFormats = [
    { id: '1', name: 'DD/MM/YYYY' },
    { id: '2', name: 'MM/DD/YYYY' },
    { id: '3', name: 'YYYY/MM/DD' }
  ];

  dateFormatSeparators = [
    { id: '1', name: '.' },
    { id: '2', name: '-' },
    { id: '3', name: '/' }
  ];

  // dateFormat = signal<number>(0);
  // dateFormatSeparator = signal<number>(0);
  tooltipPosition = 'above' as TooltipPosition;
  settingsForm = this.fb.nonNullable.group({
        date_format: ['', [Validators.required, Validators.maxLength(12)]],
        date_format_separator: ['', [Validators.required, Validators.maxLength(255)]],
  });

  readonly form = this.settingsForm;

  getSaveData(): { date_format: string; date_format_separator: string } | false {
    if (!this.settingsForm.valid) {
      return false;
    }

    const formData = { action: 'update-settings', date_format: '', date_format_separator: '' };
    const settings = this.settingsForm.getRawValue();
    formData.date_format = settings.date_format;
    formData.date_format_separator = settings.date_format_separator;
    return formData;
  }
}
