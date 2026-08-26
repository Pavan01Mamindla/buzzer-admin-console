import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { Sport } from '../../models/sport.model';

export interface SportFormDialogData {
  sport?: Sport;
}

@Component({
  selector: 'app-sport-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './sport-form.component.html',
  styleUrl: './sport-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SportFormComponent {

  private readonly fb = inject(FormBuilder);

  private readonly dialogRef =
    inject(MatDialogRef<SportFormComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly data: SportFormDialogData
  ) {
    this.form.patchValue({
      name: this.data?.sport?.name ?? '',
      description: this.data?.sport?.description ?? '',
      iconUrl: this.data?.sport?.iconUrl ?? ''
    });
  }

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    ],

    description: [
      '',
      [
        Validators.maxLength(500)
      ]
    ],

    iconUrl: [
      '',
      [
        Validators.maxLength(1000)
      ]
    ]
  });

  get editing(): boolean {
    return !!this.data?.sport;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      name: this.form.controls.name.value.trim(),
      description:
        this.form.controls.description.value.trim(),
      iconUrl:
        this.form.controls.iconUrl.value.trim()
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
