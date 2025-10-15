import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PassengerFormComponent } from './passenger-form/passenger-form.component';
import { FlightSeatComponent } from './flight-seat/flight-seat.component';
import { PdpaPageComponent } from './pdpa-page/pdpa-page.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { ConfirmPayComponent } from './confirm-pay/confirm-pay.component';
import { CounterServicePageComponent } from './counter-service-page/counter-service-page.component';
import { AlertErrorComponent } from './alert-error/alert-error.component';
import { PassengerNotFoundComponent } from './passenger-not-found/passenger-not-found.component';

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
    path: 'counter-service',
    component: CounterServicePageComponent
  },
  {
    path: 'error',
    component: AlertErrorComponent
  },
  {
    path: 'passenger-not-found',
    component: PassengerNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
