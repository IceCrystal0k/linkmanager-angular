import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TooltipPosition, MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImageUpload } from '../common/image-upload';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.html',
    imports: [ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatIconModule, ImageUpload, MatTooltipModule]
})
export class UserProfile {
  private fb = inject(FormBuilder);

  email = signal<string>('');
  avatar = signal<string>('');
  avatarDeleted = signal<boolean>(false);
  readonly isAvatarEditing = signal(false);
  avatarImage: File | null = null;
  tooltipPosition = 'above' as TooltipPosition;
  profileForm = this.fb.nonNullable.group({
        first_name: ['', [Validators.required, Validators.maxLength(255)]],
        last_name: ['', [Validators.required, Validators.maxLength(255)]],
    });

  ngOnInit(): void {
    this.avatar.set(localStorage.getItem('user_avatar') || '');
    this.email.set(localStorage.getItem('user_email') || '');
  }

  readonly form = this.profileForm;

  editAvatar(): void {
    this.isAvatarEditing.set(true);
  }

  deleteAvatar(): void {
    this.avatarImage = null;
    this.avatar.set('');
    this.avatarDeleted.set(true);
    this.isAvatarEditing.set(false);
  }

  onAvatarSelected(image: File): void {
    this.avatarImage = image;
    this.avatarDeleted.set(false);
  }

  getSaveData(): FormData | false {
    if (!this.profileForm.valid) {
      return false;
    }

    const formData = new FormData();
    const profile = this.profileForm.getRawValue();
    formData.append('first_name', profile.first_name);
    formData.append('last_name', profile.last_name);
    if (this.avatarImage) {
      formData.append('avatar', this.avatarImage);
    }
    else {
      formData.append('avatar_deleted', this.avatarDeleted() ? '1' : '0');
    }
    return formData;
  }
}
