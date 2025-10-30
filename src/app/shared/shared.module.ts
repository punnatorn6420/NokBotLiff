import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { HeaderComponent } from './header/header.component';
import { LoadingComponent } from './loading/loading.component';
import { DialogComponent } from './dialog/dialog.component';
import { AlertErrorComponent } from './alert-error/alert-error.component';

@NgModule({
  declarations: [
    HeaderComponent,
    LoadingComponent,
    DialogComponent,
    AlertErrorComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  exports: [
    HeaderComponent,
    LoadingComponent,
    DialogComponent,
    AlertErrorComponent,
    TranslateModule,
  ],
})
export class SharedModule {}


