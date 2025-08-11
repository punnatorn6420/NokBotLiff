import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-alert-error',
  templateUrl: './alert-error.component.html',
  styleUrls: ['./alert-error.component.scss']
})
export class AlertErrorComponent {

  constructor(
    private location: Location
  ) { }

  retry() {
    this.location.back();
  }
}
