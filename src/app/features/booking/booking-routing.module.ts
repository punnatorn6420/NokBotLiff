import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PassengerFormComponent } from '../../pages/passenger-form/passenger-form.component';
import { FlightSeatComponent } from '../../pages/flight-seat/flight-seat.component';
import { PdpaPageComponent } from '../../pages/pdpa-page/pdpa-page.component';
import { ReviewPageComponent } from '../../pages/review-page/review-page.component';
import { ConfirmPayComponent } from '../../pages/confirm-pay/confirm-pay.component';
import { PaymentStatusSuccessComponent } from '../../pages/payment-status-success/payment-status-success.component';

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

