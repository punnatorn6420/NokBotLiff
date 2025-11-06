import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { ThaiNativeDateAdapter, TH_DATE_FORMATS } from '../../core/services/date-adapter-th';

import { BookingRoutingModule } from './booking-routing.module';
import { PassengerFormComponent } from '../../page/passenger-form/passenger-form.component';
import { FlightSeatComponent } from '../../page/flight-seat/flight-seat.component';
import { PdpaPageComponent } from '../../page/pdpa-page/pdpa-page.component';
import { ReviewPageComponent } from '../../page/review-page/review-page.component';
import { ConfirmPayComponent } from '../../page/confirm-pay/confirm-pay.component';
import { PaymentStatusSuccessComponent } from '../../page/payment-status-success/payment-status-success.component';

@NgModule({
  declarations: [
    PassengerFormComponent,
    FlightSeatComponent,
    PdpaPageComponent,
    ReviewPageComponent,
    ConfirmPayComponent,
    PaymentStatusSuccessComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    BookingRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatIconModule,
    MatCheckboxModule,
    TranslateModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ThaiNativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: TH_DATE_FORMATS },
  ],
})
export class BookingModule { }


