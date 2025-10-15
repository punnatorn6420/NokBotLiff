import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-alert-error',
  templateUrl: './alert-error.component.html',
  styleUrls: ['./alert-error.component.scss']
})
export class AlertErrorComponent {

  isError = false;
  isNotFound = false;
  isSeatAlreadyBooked = false;
  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe((params: any) => {
      this.isError = params.isError;
      this.isNotFound = params.isNotFound;
      this.isSeatAlreadyBooked = params.isSeatAlreadyBooked;
    });
   }

  retry() {
    this.location.back();
  }

  BacktoSeatSelection() {
    this.router.navigate(['/select-seat']);
  }
}
