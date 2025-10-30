import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlertErrorComponent } from './shared/alert-error/alert-error.component';

const routes: Routes = [
  { path: 'error', component: AlertErrorComponent },
  { path: '', loadChildren: () => import('./features/booking/booking.module').then(m => m.BookingModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
