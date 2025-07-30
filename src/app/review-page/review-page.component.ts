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
  needsSpecialAssistance?: boolean;
  disabledVision?: boolean;
  disabledHearing?: boolean;
  monk?: boolean;
  nun?: boolean;
  pregnantWoman?: boolean;
  wheelchairUser?: boolean;
  unaccompaniedMinor?: boolean;
  other?: boolean;
  otherReason?: string;
  // seatID: string;
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
  seatData: { inbound?: { [key: number]: string }, outbound?: { [key: number]: string } } = {};
  constructor(
    private router: Router,
    private passDataService: PassDataService,
    // private translate: TranslateService
    ) { 
      this.passDataService.getFormData().subscribe((data: any) => {
        if (data && Object.keys(data).length > 0) {
          console.log("getFormData review-page",data);
          this.formData = data as any[];
          // ตรวจสอบว่า data เป็น object หรือ array
          if (Array.isArray(data)) {
            // ถ้าเป็น array ให้แปลงเป็น object ก่อน
            const passengerObject: { [key: number]: any } = {};
            data.forEach((passenger, index) => {
              passengerObject[index + 1] = passenger;
            });
            this.passengers = this.convertToOrderedArray(passengerObject);
          } else {
            // ถ้าเป็น object ให้แปลงเป็น array ตามลำดับ
            this.passengers = this.convertToOrderedArray(data);
          }
          this.isPassengerInfoOpen = new Array(this.passengers.length).fill(true);
          console.log(this.passengers);
        } else {
          this.formData = [];
          this.passengers = [];
          this.isPassengerInfoOpen = [];
        }
      });

      this.passDataService.getSeatData().subscribe((data: any) => {
        if (data && Object.keys(data).length > 0) {
          console.log("getSeatData review-page",data);
          this.seatData = data as { [key: number]: string }; // เปลี่ยนเป็น object
          console.log("seatData",this.seatData);
        } else {
          this.seatData = {};
        }
      });
    }

  // เพิ่มฟังก์ชันสำหรับแปลงข้อมูลให้รักษาลำดับ
  private convertToOrderedArray(data: any): any[] {
    const keys = Object.keys(data).map(Number).sort((a, b) => a - b);
    return keys.map(key => data[key]);
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // this.passDataService.getFormData().subscribe((data: any) => {
    //   if (data && Object.keys(data).length > 0) {
    //     this.formData = data as Passenger[];
    //     this.passengers = Object.values(this.formData);
    //     this.isPassengerInfoOpen = new Array(this.passengers.length).fill(true);
    //   } else {
    //     this.formData = [];
    //     this.passengers = [];
    //     this.isPassengerInfoOpen = [];
    //   }
    // });
  }

  hasSeatPassengers(): boolean {
    // ตรวจสอบว่า seatData มีข้อมูลหรือไม่
    return Object.keys(this.seatData).length > 0 && 
           Object.values(this.seatData).some(seat => seat && seat !== '');
  }

  // เพิ่ม method สำหรับดึง seat ของ passenger
  getPassengerSeat(passengerIndex: number, flight: string): string {
    if (flight === 'inbound') {
      return this.seatData.inbound?.[passengerIndex] || '';
    } else if (flight === 'outbound') {
      return this.seatData.outbound?.[passengerIndex] || '';
    } else {
      return '';
    }
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

  editInfoPassenger(passengerIndex: number) {
    this.router.navigate(['/form'], { queryParams: { passengerIndex: passengerIndex+1 } });
  }

  editInfoSelectSeat() {
    this.router.navigate(['/select-seat']);
  }
}
