import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PassengerFormComponent } from './passenger-form/passenger-form.component';
import { FlightSeatComponent } from './flight-seat/flight-seat.component';
import { PdpaPageComponent } from './pdpa-page/pdpa-page.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { ConfirmPayComponent } from './confirm-pay/confirm-pay.component';
import { AlertErrorComponent } from './alert-error/alert-error.component';
import { PaymentStatusSuccessComponent } from './payment-status-success/payment-status-success.component';
import { PaymentStatusFailComponent } from './payment-status-fail/payment-status-fail.component';
import { PaymentStatusCancelComponent } from './payment-status-cancel/payment-status-cancel.component';

const routes: Routes = [
  {
    path: 'pdpa',
    component: PdpaPageComponent
  },
  {
    path: 'form',
    component: PassengerFormComponent
  },
  {
    path: 'select-seat',
    component: FlightSeatComponent
  },
  {
    path: 'review',
    component: ReviewPageComponent
  },
  {
    path: 'confirm-pay',
    component: ConfirmPayComponent
  },
  {
    path: 'error',
    component: AlertErrorComponent
  },
  {
    path: 'payment-page',
    component: PaymentStatusSuccessComponent
  },
  {
    path: 'payment-status-fail',
    component: PaymentStatusFailComponent
  },
  {
    path: 'payment-status-cancel',
    component: PaymentStatusCancelComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
