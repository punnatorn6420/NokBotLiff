import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PassDataService } from '../../core/services/pass-data.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {
  constructor(
    private dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private passDataService: PassDataService,
    private translate: TranslateService
  ) {
    this.passDataService.getLanguage().subscribe(language => {
      this.switchLanguage(language as 'th' | 'en');
    });
  }

  isDialog: string = this.data.isDialog;
  message: string = this.data.message || '';
  apiAdults: number = Number(this.data.apiAdults ?? 0);
  apiChildren: number = Number(this.data.apiChildren ?? 0);
  apiInfants: number = Number(this.data.apiInfants ?? 0);
  currentAdults: number = Number(this.data.currentAdults ?? 0);
  currentChildren: number = Number(this.data.currentChildren ?? 0);
  currentInfants: number = Number(this.data.currentInfants ?? 0);

  onClose(): void {
    this.dialogRef.close({
      result: 'reject'
    });
  }

  onConfirm(): void {
    this.dialogRef.close({
      result: 'confirm'
    });
  }

  switchLanguage(lang: 'th' | 'en') {
    this.translate.use(lang);
  }

  getWarningMessage(): string {
    return this.message;
  }
}
