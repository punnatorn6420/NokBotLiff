import { Component, Input } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
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
  phonePrefix?: string;
  selectedPrefix: string;
  seatID: string;
}

@Component({
  selector: 'app-flight-seat',
  templateUrl: './flight-seat.component.html',
  styleUrls: ['./flight-seat.component.scss']
})
export class FlightSeatComponent {
  @Input() selectedPassenger: number = 2;
  selectedFlight: string = 'inbound';
  selectedSeat: any[] = [];
  selectedSeatPrice: number = 0;
  isShowDetailSeatPrice: boolean = false;
  // isGetAlertExit: string[] = [];
  SelectedSeat: any[] = [];
  formData: Passenger[] = [];
  passengers: Passenger[] = [];
  seatMap = [
    // 1
    [
      { label: '1A', status: 'available', type: 'premium-plus' , price: 1000 , exit: true},
      { label: '1B', status: 'available', type: 'premium-plus' , price: 1000 , exit: true},
      { label: '1C', status: 'available', type: 'premium-plus' , price: 1000 , exit: true},
      null,
      null,
      null,
      null,
    ],
    // 2
    [
      { label: '2A', status: 'available', type: 'premium' , price: 1000},
      { label: '2B', status: 'available', type: 'premium' , price: 1000},
      { label: '2C', status: 'available', type: 'premium' , price: 1000},
      null, 
      { label: '2H', status: 'available', type: 'premium' , price: 1000},
      { label: '2J', status: 'available', type: 'premium' , price: 1000},
      { label: '2K', status: 'available', type: 'premium' , price: 1000}
    ],
    // 3
    [
      { label: '3A', status: 'available', type: 'premium' , price: 1000},
      { label: '3B', status: 'available', type: 'premium' , price: 1000},
      { label: '3C', status: 'available', type: 'premium' , price: 1000},
      null,
      { label: '3H', status: 'available', type: 'premium' , price: 1000},
      { label: '3J', status: 'available', type: 'premium' , price: 1000},
      { label: '3K', status: 'available', type: 'premium' , price: 1000}
    ],
    // 4-6
    [
      { label: '4A', status: 'available', type: 'premium' , price: 1000},
      { label: '4B', status: 'available', type: 'premium' , price: 1000},
      { label: '4C', status: 'available', type: 'premium' , price: 1000},
      null,
      { label: '4H', status: 'available', type: 'premium' , price: 1000},
      { label: '4J', status: 'available', type: 'premium' , price: 1000},
      { label: '4K', status: 'available', type: 'premium' , price: 1000}
    ],
    // 5
    [
      { label: '5A', status: 'available', type: 'premium' , price: 1000},
      { label: '5B', status: 'available', type: 'premium' , price: 1000},
      { label: '5C', status: 'available', type: 'premium' , price: 1000},
      null,
      { label: '5H', status: 'available', type: 'premium' , price: 1000},
      { label: '5J', status: 'available', type: 'premium' , price: 1000},
      { label: '5K', status: 'available', type: 'premium' , price: 1000}
    ],
    // 6
    [
      { label: '6A', status: 'available', type: 'premium' , price: 1000},
      { label: '6B', status: 'available', type: 'premium' , price: 1000},
      { label: '6C', status: 'available', type: 'premium' , price: 1000},
      null,
      { label: '6H', status: 'available', type: 'premium' , price: 1000},
      { label: '6J', status: 'available', type: 'premium' , price: 1000},
      { label: '6K', status: 'available', type: 'premium' , price: 1000}
    ],
    // 7
    [
      { label: '7A', status: 'available', type: 'regular' , price: 1000},
      { label: '7B', status: 'available', type: 'regular' , price: 1000},
      { label: '7C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '7H', status: 'available', type: 'regular' , price: 1000},
      { label: '7J', status: 'available', type: 'regular' , price: 1000},
      { label: '7K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 8
    [
      { label: '8A', status: 'available', type: 'regular' , price: 1000},
      { label: '8B', status: 'available', type: 'regular' , price: 1000},
      { label: '8C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '8H', status: 'available', type: 'regular' , price: 1000},
      { label: '8J', status: 'available', type: 'regular' , price: 1000},
      { label: '8K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 9
    [
      { label: '9A', status: 'available', type: 'regular' , price: 1000},
      { label: '9B', status: 'available', type: 'regular' , price: 1000},
      { label: '9C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '9H', status: 'available', type: 'regular' , price: 1000},
      { label: '9J', status: 'available', type: 'regular' , price: 1000},
      { label: '9K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 10
    [
      { label: '10A', status: 'available', type: 'regular' , price: 1000},
      { label: '10B', status: 'available', type: 'regular' , price: 1000},
      { label: '10C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '10H', status: 'available', type: 'regular' , price: 1000},
      { label: '10J', status: 'available', type: 'regular' , price: 1000},
      { label: '10K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 11
    [
      { label: '11A', status: 'available', type: 'regular' , price: 1000},
      { label: '11B', status: 'available', type: 'regular' , price: 1000},
      { label: '11C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '11H', status: 'available', type: 'regular' , price: 1000},
      { label: '11J', status: 'available', type: 'regular' , price: 1000},
      { label: '11K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 12
    [
      { label: '12A', status: 'available', type: 'regular' , price: 1000},
      { label: '12B', status: 'available', type: 'regular' , price: 1000},
      { label: '12C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '12H', status: 'available', type: 'regular' , price: 1000},
      { label: '12J', status: 'available', type: 'regular' , price: 1000},
      { label: '12K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 13
    [
      { label: '13A', status: 'available', type: 'regular' , price: 1000},
      { label: '13B', status: 'available', type: 'regular' , price: 1000},
      { label: '13C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '13H', status: 'available', type: 'regular' , price: 1000},
      { label: '13J', status: 'available', type: 'regular' , price: 1000},
      { label: '13K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 14
    [
      { label: '14A', status: 'available', type: 'regular' , price: 1000},
      { label: '14B', status: 'available', type: 'regular' , price: 1000},
      { label: '14C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '14H', status: 'available', type: 'regular' , price: 1000},
      { label: '14J', status: 'available', type: 'regular' , price: 1000},
      { label: '14K', status: 'available', type: 'regular' , price: 1000}
    ],
    // 15
    [
      { label: '15A', status: 'available', type: 'regular' , price: 1000},
      { label: '15B', status: 'available', type: 'regular' , price: 1000},
      { label: '15C', status: 'available', type: 'regular' , price: 1000},
      null,
      { label: '15H', status: 'available', type: 'regular' , price: 1000},
      { label: '15J', status: 'available', type: 'regular' , price: 1000},
      { label: '15K', status: 'available', type: 'regular' , price: 1000}
    ],
    [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    // 16
    [
      { label: '16A', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '16B', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '16C', status: 'available', type: 'premium', price: 1000 , exit: true},
      null,
      { label: '16H', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '16J', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '16K', status: 'available', type: 'premium', price: 1000 , exit: true}
    ],
    [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    // 17
    [
      { label: '17A', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '17B', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '17C', status: 'available', type: 'premium', price: 1000 , exit: true},
      null,
      { label: '17H', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '17J', status: 'available', type: 'premium', price: 1000 , exit: true},
      { label: '17K', status: 'available', type: 'premium', price: 1000 , exit: true}
    ],
    // 18
    [
      { label: '18A', status: 'available', type: 'regular', price: 1000 },
      { label: '18B', status: 'available', type: 'regular', price: 1000 },
      { label: '18C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '18H', status: 'available', type: 'regular', price: 1000 },
      { label: '18J', status: 'available', type: 'regular', price: 1000 },
      { label: '18K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 19
    [
      { label: '19A', status: 'available', type: 'regular', price: 1000 },
      { label: '19B', status: 'available', type: 'regular', price: 1000 },
      { label: '19C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '19H', status: 'available', type: 'regular', price: 1000 },
      { label: '19J', status: 'available', type: 'regular', price: 1000 },
      { label: '19K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 20
    [
      { label: '20A', status: 'available', type: 'regular', price: 1000 },
      { label: '20B', status: 'available', type: 'regular', price: 1000 },
      { label: '20C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '20H', status: 'available', type: 'regular', price: 1000 },
      { label: '20J', status: 'available', type: 'regular', price: 1000 },
      { label: '20K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 21
    [
      { label: '21A', status: 'available', type: 'regular', price: 1000 },
      { label: '21B', status: 'available', type: 'regular', price: 1000 },
      { label: '21C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '21H', status: 'available', type: 'regular', price: 1000 },
      { label: '21J', status: 'available', type: 'regular', price: 1000 },
      { label: '21K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 22
    [
      { label: '22A', status: 'available', type: 'regular', price: 1000 },
      { label: '22B', status: 'available', type: 'regular', price: 1000 },
      { label: '22C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '22H', status: 'available', type: 'regular', price: 1000 },
      { label: '22J', status: 'available', type: 'regular', price: 1000 },
      { label: '22K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 23
    [
      { label: '23A', status: 'available', type: 'regular', price: 1000 },
      { label: '23B', status: 'available', type: 'regular', price: 1000 },
      { label: '23C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '23H', status: 'available', type: 'regular', price: 1000 },
      { label: '23J', status: 'available', type: 'regular', price: 1000 },
      { label: '23K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 24
    [
      { label: '24A', status: 'available', type: 'regular', price: 1000 },
      { label: '24B', status: 'available', type: 'regular', price: 1000 },
      { label: '24C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '24H', status: 'available', type: 'regular', price: 1000 },
      { label: '24J', status: 'available', type: 'regular', price: 1000 },
      { label: '24K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 25
    [
      { label: '25A', status: 'available', type: 'regular', price: 1000 },
      { label: '25B', status: 'available', type: 'regular', price: 1000 },
      { label: '25C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '25H', status: 'available', type: 'regular', price: 1000 },
      { label: '25J', status: 'available', type: 'regular', price: 1000 },
      { label: '25K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 26
    [
      { label: '26A', status: 'available', type: 'regular', price: 1000 },
      { label: '26B', status: 'available', type: 'regular', price: 1000 },
      { label: '26C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '26H', status: 'available', type: 'regular', price: 1000 },
      { label: '26J', status: 'available', type: 'regular', price: 1000 },
      { label: '26K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 27
    [
      { label: '27A', status: 'available', type: 'regular', price: 1000 },
      { label: '27B', status: 'available', type: 'regular', price: 1000 },
      { label: '27C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '27H', status: 'available', type: 'regular', price: 1000 },
      { label: '27J', status: 'available', type: 'regular', price: 1000 },
      { label: '27K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 28
    [
      { label: '28A', status: 'available', type: 'regular', price: 1000 },
      { label: '28B', status: 'available', type: 'regular', price: 1000 },
      { label: '28C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '28H', status: 'available', type: 'regular', price: 1000 },
      { label: '28J', status: 'available', type: 'regular', price: 1000 },
      { label: '28K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 29
    [
      { label: '29A', status: 'available', type: 'regular', price: 1000 },
      { label: '29B', status: 'available', type: 'regular', price: 1000 },
      { label: '29C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '29H', status: 'available', type: 'regular', price: 1000 },
      { label: '29J', status: 'available', type: 'regular', price: 1000 },
      { label: '29K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 30
    [
      { label: '30A', status: 'available', type: 'regular', price: 1000 },
      { label: '30B', status: 'available', type: 'regular', price: 1000 },
      { label: '30C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '30H', status: 'available', type: 'regular', price: 1000 },
      { label: '30J', status: 'available', type: 'regular', price: 1000 },
      { label: '30K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 31
    [
      { label: '31A', status: 'available', type: 'regular', price: 1000 },
      { label: '31B', status: 'available', type: 'regular', price: 1000 },
      { label: '31C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '31H', status: 'available', type: 'regular', price: 1000 },
      { label: '31J', status: 'available', type: 'regular', price: 1000 },
      { label: '31K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 32
    [
      { label: '32A', status: 'available', type: 'regular', price: 1000 },
      { label: '32B', status: 'available', type: 'regular', price: 1000 },
      { label: '32C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '32H', status: 'available', type: 'regular', price: 1000 },
      { label: '32J', status: 'available', type: 'regular', price: 1000 },
      { label: '32K', status: 'available', type: 'regular', price: 1000 }
    ],
    // 33
    [
      { label: '33A', status: 'available', type: 'regular', price: 1000 },
      { label: '33B', status: 'available', type: 'regular', price: 1000 },
      { label: '33C', status: 'available', type: 'regular', price: 1000 },
      null,
      { label: '33H', status: 'available', type: 'regular', price: 1000 },
      { label: '33J', status: 'available', type: 'regular', price: 1000 },
      { label: '33K', status: 'available', type: 'regular', price: 1000 }
    ],
  ];

  constructor(private dialog: MatDialog,
    private router: Router,
    private passDataService: PassDataService,
    private translate: TranslateService) {
      this.passDataService.getLanguage().subscribe((data: any) => {
        this.switchLanguage(data as 'th' | 'en');
      });
  }

  ngOnInit() {
    this.passDataService.getFormData().subscribe((data: any) => {
      this.formData = data as Passenger[];
      this.passengers = Object.values(this.formData);
    });
    
  }

  switchLanguage(lang: 'th' | 'en') {
    this.translate.use(lang);
  }

  toggleFlight(flight: string) {
    this.selectedFlight = flight;
  }

  selectSeat(seat: any) {
    console.log('จำนวนที่นั่งที่เลือกแล้ว:', this.SelectedSeat.length);
    console.log('จำนวนผู้โดยสาร:', this.passengers.length);
    
    // ตรวจสอบว่าที่นั่งนี้ถูกเลือกแล้วหรือไม่
    if (this.SelectedSeat.includes(seat.label) && seat.status === 'selected') {
      // ถ้าเลือกแล้ว ให้ยกเลิกการเลือก
      seat.status = 'available';
      
      // หาผู้โดยสารที่มีที่นั่งนี้และลบ seatID ออก
      const passengerWithSeat = this.passengers.find(p => p.seatID === seat.label);
      if (passengerWithSeat) {
        passengerWithSeat.seatID = '';
      }
      
      this.selectedSeat = this.selectedSeat.filter(s => s.label !== seat.label);
      this.selectedSeatPrice = this.selectedSeat.reduce((sum, s) => sum + (s.price || 0), 0);
      this.SelectedSeat = this.SelectedSeat.filter(s => s !== seat.label);
      return;
    }
    
    // ตรวจสอบว่าจำนวนที่นั่งที่เลือกแล้วไม่เกินจำนวนผู้โดยสาร
    if (this.SelectedSeat.length >= this.passengers.length) {
      console.log("ไม่สามารถเลือกที่นั่งเพิ่มได้ เนื่องจากเลือกครบจำนวนผู้โดยสารแล้ว");
      return;
    }
    
    // ตรวจสอบที่นั่ง exit row
    if (seat.exit) {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: {
          isDialog: 'alert_exit'
        }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          // ตรวจสอบอีกครั้งหลังจาก dialog ปิด
          if (this.SelectedSeat.length < this.passengers.length && seat.status === 'available') {
            seat.status = 'selected';
            // หาผู้โดยสารคนแรกที่ยังไม่มีที่นั่ง
            const passengerIndex = this.passengers.findIndex(p => !p.seatID || p.seatID === '');
            if (passengerIndex !== -1) {
              this.passengers[passengerIndex].seatID = seat.label;
            }
            this.selectedSeat.push(seat);
            this.SelectedSeat.push(seat.label);
            this.selectedSeatPrice = this.selectedSeat.reduce((sum, s) => sum + (s.price || 0), 0);
          }
        }
      });
      return;
    }

    // เลือกที่นั่งปกติ
    if (seat.status === 'available') {
      seat.status = 'selected';
      // หาผู้โดยสารคนแรกที่ยังไม่มีที่นั่ง
      const passengerIndex = this.passengers.findIndex(p => !p.seatID || p.seatID === '');
      if (passengerIndex !== -1) {
        this.passengers[passengerIndex].seatID = seat.label;
      }
      this.selectedSeat.push(seat);
      this.SelectedSeat.push(seat.label);
      this.selectedSeatPrice = this.selectedSeat.reduce((sum, s) => sum + (s.price || 0), 0);
    }

    console.log(this.passengers);
    
  }

  onNextStep() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '350px',
      disableClose: true,
      data: {
        isDialog: 'alert_select_seat'
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result.result === 'confirm') {
        return;
      }
    });
  }

  onCancelSelect() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '350px',
      disableClose: true,
      data: {
        isDialog: 'cancel_select_seat'
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result.result === 'confirm') {
        this.selectedSeat.forEach(seat => {
          seat.status = 'available';
        });
        // ลบ seatID ทั้งหมดจากผู้โดยสาร
        this.passengers.forEach(passenger => {
          passenger.seatID = '';
        });
        this.selectedSeat = [];
        this.selectedSeatPrice = 0;
        this.SelectedSeat = [];
      }
    });
  }

  confirmSelectSeat() {
    if (this.selectedSeat.length < this.passengers.length) {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: {
          isDialog: 'alert_select_seat_not_enough'
        }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          console.log("selectedSeat",this.selectedSeat);
        }
      });
    } else {
      console.log("selectedSeat",this.selectedSeat);
    }
  }

  getPassengerNameBySeat(seat: any): string {
    // หาผู้โดยสารที่มี seatID ตรงกับที่นั่งนี้
    const passenger = this.passengers.find(p => p.seatID === seat.label);
    
    if (passenger) {
      return `${passenger.firstName.charAt(0)} ${passenger.lastName.charAt(0)}`;
    }
    return seat.label;
  }
}
