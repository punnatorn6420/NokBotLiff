import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirm-pay',
  templateUrl: './confirm-pay.component.html',
  styleUrls: ['./confirm-pay.component.scss']
})
export class ConfirmPayComponent {
  selectedPayment = 'credit';

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/review']);
  }
  goNext() {
    console.log(this.selectedPayment);
    if (this.selectedPayment === 'credit') {
      this.router.navigate(['/credit']);
    } else if (this.selectedPayment === 'counterservice') {
      this.router.navigate(['/counter-service']);
    }
  }
}
