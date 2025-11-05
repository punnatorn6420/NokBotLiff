import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ThaiNativeDateAdapter, TH_DATE_FORMATS } from './core/services/date-adapter-th';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { MultiTranslateHttpLoader } from './core/services/i18n/multi-translate-loader';
import { APP_BASE_HREF } from '@angular/common';
import { HttpErrorInterceptorInterceptor } from './core/interceptors/http-error-interceptor.interceptor';
import { SharedModule } from './shared/shared.module';
import { MatCheckboxModule } from '@angular/material/checkbox';

export function HttpLoaderFactory(http: HttpClient) {
  return new MultiTranslateHttpLoader(http, [
    { prefix: './assets/i18n/', suffix: '/common.json' },
    { prefix: './assets/i18n/', suffix: '/passenger.json' },
    { prefix: './assets/i18n/', suffix: '/seat.json' },
    { prefix: './assets/i18n/', suffix: '/review.json' },
    { prefix: './assets/i18n/', suffix: '/confirm.json' },
    { prefix: './assets/i18n/', suffix: '/pdpa.json' },
    { prefix: './assets/i18n/', suffix: '/dialog.json' },
    { prefix: './assets/i18n/', suffix: '/counter.json' }
  ]);
}


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    HttpClientModule,
    MatCheckboxModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/botnoi-liff/' },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptorInterceptor, multi: true },
    { provide: DateAdapter, useClass: ThaiNativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: TH_DATE_FORMATS }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
