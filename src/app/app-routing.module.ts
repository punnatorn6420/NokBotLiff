import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PassengerFormComponent } from './passenger-form/passenger-form.component';
import { FlightSeatComponent } from './flight-seat/flight-seat.component';
import { PdpaPageComponent } from './pdpa-page/pdpa-page.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { ConfirmPayComponent } from './confirm-pay/confirm-pay.component';
import { CounterServicePageComponent } from './counter-service-page/counter-service-page.component';

const routes: Routes = [
  {
    path: '',
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
    path: 'counter-service',
    component: CounterServicePageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
