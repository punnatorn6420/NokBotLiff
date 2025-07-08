import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PassDataService } from '../pass-data.service';
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
    console.log(lang);
    this.translate.use(lang);
  }
}
