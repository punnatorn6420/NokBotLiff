import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { PassDataService } from '../pass-data.service';
import { TranslateService } from '@ngx-translate/core';

interface Passenger {
  birthDate: Date;
  country: string;
  email?: string;
  expireDate: Date;
  firstName: string;
  issuedBy: string;
  lastName: string;
  middleName: string;
  nationality: string;
  passportNumber: string;
  phoneNumber?: string;
  dialCode?: string;
  selectedPrefix: string;
  seatID: string;
}

@Component({
  selector: 'app-review-page',
  templateUrl: './review-page.component.html',
  styleUrls: ['./review-page.component.scss']
})
export class ReviewPageComponent {
  isPassengerInfoOpen: boolean[] = [];
  // selectedSeat: any[] = [];
  // selectedSeatPrice: number = 0;
  // isShowDetailSeatPrice: boolean = false;
  // SelectedSeat: any[] = [];
  formData: Passenger[] = [];
  passengers: Passenger[] = [];
  constructor(
    private router: Router,
    private passDataService: PassDataService,
    private translate: TranslateService) {    
    }

  ngOnInit() {
    this.passDataService.getFormData().subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        this.formData = data as Passenger[];
        this.passengers = Object.values(this.formData);
        this.isPassengerInfoOpen = new Array(this.passengers.length).fill(true);
      } else {
        this.formData = [];
        this.passengers = [];
        this.isPassengerInfoOpen = [];
      }
    });
  }

  hasSeatPassengers(): boolean {
    return this.passengers.some(p => p.seatID && p.seatID !== '');
  }

  togglePassengerInfo(index: number) {
    this.isPassengerInfoOpen[index] = !this.isPassengerInfoOpen[index];
  }

  goBack() {
    this.router.navigate(['/select-seat']);
  }

  goNext() {
    this.router.navigate(['/confirm-pay']);
  }
}
