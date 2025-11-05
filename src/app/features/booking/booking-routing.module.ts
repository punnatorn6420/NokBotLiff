import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PassengerFormComponent } from '../../page/passenger-form/passenger-form.component';
import { FlightSeatComponent } from '../../page/flight-seat/flight-seat.component';
import { PdpaPageComponent } from '../../page/pdpa-page/pdpa-page.component';
import { ReviewPageComponent } from '../../page/review-page/review-page.component';
import { ConfirmPayComponent } from '../../page/confirm-pay/confirm-pay.component';
import { PaymentStatusSuccessComponent } from '../../page/payment-status-success/payment-status-success.component';

const routes: Routes = [
  { path: 'pdpa', component: PdpaPageComponent },
  { path: 'form', component: PassengerFormComponent },
  { path: 'select-seat', component: FlightSeatComponent },
  { path: 'review', component: ReviewPageComponent },
  { path: 'confirm-pay', component: ConfirmPayComponent },
  { path: 'payment-page', component: PaymentStatusSuccessComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingRoutingModule {}


