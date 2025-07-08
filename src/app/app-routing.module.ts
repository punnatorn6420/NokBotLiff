import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PassengerFormComponent } from './passenger-form/passenger-form.component';
import { FlightSeatComponent } from './flight-seat/flight-seat.component';

const routes: Routes = [
  {
    path: '',
    component: PassengerFormComponent
  },
  {
    path: 'seat',
    component: FlightSeatComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
