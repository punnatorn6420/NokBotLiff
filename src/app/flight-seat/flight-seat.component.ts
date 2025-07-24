import { Component, Input } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PassDataService } from '../pass-data.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../api.service';

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
}

interface CabinInfoResponse {
  cabinInfos: CabinInfo[];
}

interface CabinInfo {
  cabinName: string;
  seatCount: number;
  seatMaps: SeatMapRow[];
}

interface SeatMapRow {
  rowNumber: number;
  seats: SeatInfo[];
}

interface SeatInfo {
  seatId: string;
  seatLatter: string;
  wingSeat: boolean;
  exitSeat: boolean;
  preBlockedSeat: boolean;
  serviceCode: string;
  amount: number;
  vat: number;
  amountIncludingVat: number;
  currency: string;
  available: boolean;
}

interface SeatMap {
  label: string;
  status: string;
  type: string;
  price: number;
  exit: boolean;
  seatId?: string;
  serviceCode?: string;
  amount?: number;
  vat?: number;
  amountIncludingVat?: number;
  currency?: string;
  wingSeat?: boolean;
  preBlockedSeat?: boolean;
}

@Component({
  selector: 'app-flight-seat',
  templateUrl: './flight-seat.component.html',
  styleUrls: ['./flight-seat.component.scss']
})
export class FlightSeatComponent {
  @Input() selectedPassenger: number = 2;
  selectedFlight: string = 'inbound'; // 'inbound' = ขาไป, 'outbound' = ขากลับ
  
  // ข้อมูลที่นั่งแยกตามเที่ยวบิน
  selectedSeatInbound: any[] = []; // ขาไป
  selectedSeatOutbound: any[] = []; // ขากลับ
  selectedSeatConnectFlightInbound: any[] = [];
  selectedSeatConnectFlightOutbound: any[] = [];
  selectedSeatPriceInbound: number = 0;
  selectedSeatPriceOutbound: number = 0;
  
  // ข้อมูลปัจจุบันที่แสดง
  selectedSeat: any[] = [];
  selectedSeatPrice: number = 0;
  
  isShowDetailSeatPrice: boolean = false;
  SelectedSeat: any[] = [];
  formData: Passenger[] = [];
  passengers: Passenger[] = [];
  isConnectFlight: boolean = true;
  
  // เก็บข้อมูลที่นั่งแยกตามเที่ยวบิน
  passengerSeatMapInbound: { [passengerIndex: number]: string } = {}; // ขาไป
  passengerSeatMapOutbound: { [passengerIndex: number]: string } = {}; // ขากลับ
  passengerSeatMap: { [passengerIndex: number]: string } = {}; // ข้อมูลปัจจุบันที่แสดง
  passengerConnectSeatMapInbound: { [passengerIndex: number]: string } = {}; // ขาไป
  passengerConnectSeatMapOutbound: { [passengerIndex: number]: string } = {}; // ขากลับ

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

  connectFlight: string = 'flight1';

  // เพิ่ม property สำหรับเก็บข้อมูล API
  cabinInfoData: CabinInfoResponse | null = null;
  premiumPlusPrice: number = 0;
  premiumPrice: number = 0;
  regularPrice: number = 0;
  isLoading: boolean = false;

  constructor(private dialog: MatDialog,
    private router: Router,
    private passDataService: PassDataService,
    private apiService: ApiService,
    // private translate: TranslateService
    ) {
      // this.passDataService.getLanguage().subscribe((data: any) => {
      //   this.switchLanguage(data as 'th' | 'en');
      // });

      this.passDataService.getFormData().subscribe((data: any) => {
        if (data && Object.keys(data).length > 0) {
          console.log("getFormData flight-seat",data);
          this.formData = data as Passenger[];
          this.passengers = Object.values(this.formData);
  
          // --- check and set seat.status = 'selected' ---
          // 1. combine seatID that is selected from passengerSeatMap
          const selectedSeatIDs = Object.values(this.passengerSeatMap).filter((id: string) => !!id);
  
          // 2. loop seatMap and set status
          for (const row of this.seatMap) {
            for (const seat of row) {
              if (!seat) continue;
              if (selectedSeatIDs.includes(seat.label)) {
                seat.status = 'selected';
              } else if (seat.status === 'selected') {
                // if seat is selected but not in selectedSeatIDs, then reset
                seat.status = 'available';
              }
            }
          }
          // --- end ---
  
        } else {
          this.formData = [];
          this.passengers = [];
        }
      });
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.isLoading = true;
    // เรียก API ก่อนเพื่ออัปเดต seatMap
    this.apiService.getSeatMap().subscribe((data: any) => {
      console.log('API Response:', data);
      console.log('API Response type:', typeof data);
      
      // เพิ่มการตรวจสอบว่า data ไม่เป็น null ก่อนเรียก Object.keys
      if (data) {
        console.log('API Response keys:', Object.keys(data));
      } else {
        console.log('API Response is null or undefined');
      }
      
      // ตรวจสอบว่า data มีโครงสร้างที่ถูกต้องหรือไม่
      if (data && data.cabinInfos && Array.isArray(data.cabinInfos)) {
        console.log('Valid API data structure found');
        this.updateSeatMapFromCabinInfo(data);
      } else {
        console.log('Invalid API data structure, using test data');
        // this.createTestData();
      }
      
      // หลังจากอัปเดต seatMap แล้ว ให้ subscribe getSeatData
      this.subscribeToSeatData();
      this.isLoading = false;
    }, (error) => {
      console.error('API Error:', error);
      // this.createTestData();
      this.subscribeToSeatData();
    });
    
    console.log("seatMap",this.seatMap);
    
    // โหลดข้อมูลที่นั่งที่บันทึกไว้
    this.passDataService.getSeatData().subscribe((data: any) => {
      console.log("getSeatData",data);
      
      if (data) {
        // ถ้าเป็นข้อมูลแบบใหม่ที่มี inbound และ outbound
        if (data.inbound !== undefined && data.outbound !== undefined) {
          this.passengerSeatMapInbound = data.inbound || {};
          this.passengerSeatMapOutbound = data.outbound || {};
          this.selectedSeatPriceInbound = data.inboundPrice || 0;
          this.selectedSeatPriceOutbound = data.outboundPrice || 0;
          
          // โหลดข้อมูลของเที่ยวบินปัจจุบัน
          this.loadFlightData();
        } else {
          // รองรับข้อมูลแบบเดิม (backward compatibility)
          this.passengerSeatMap = data;
          this.selectedSeat = Object.values(data).filter(seat => seat);
          this.selectedSeatPrice = this.selectedSeat.reduce((sum, s) => sum + (s.price || 0), 0);
        }
      }
    });
  }

  // switchLanguage(lang: 'th' | 'en') {
  //   this.translate.use(lang);
  // }

  toggleFlight(flight: string) {
    // บันทึกข้อมูลปัจจุบันก่อนเปลี่ยน
    this.saveCurrentFlightData();
    
    // เปลี่ยนเที่ยวบิน
    this.selectedFlight = flight;
    
    // โหลดข้อมูลของเที่ยวบินที่เลือก
    this.loadFlightData();
    
    // อัปเดตหัวข้อ
    this.updateHeaderTitle();

    // เรียก subscribeToSeatData ใหม่ เพื่ออัปเดตที่นั่งตามเที่ยวบิน
    this.subscribeToSeatData();
  }

  // บันทึกข้อมูลของเที่ยวบินปัจจุบัน
  private saveCurrentFlightData() {
    console.log("saveCurrentFlightData",this.selectedFlight);
    if (this.selectedFlight === 'inbound') {
      this.selectedSeatInbound = [...this.selectedSeat];
      this.selectedSeatPriceInbound = this.selectedSeatPrice;
      this.passengerSeatMapInbound = { ...this.passengerSeatMap };
    } else {
      this.selectedSeatOutbound = [...this.selectedSeat];
      this.selectedSeatPriceOutbound = this.selectedSeatPrice;
      this.passengerSeatMapOutbound = { ...this.passengerSeatMap };
    }

    // บันทึกข้อมูลที่นั่งทั้งสองเที่ยวบิน
    const allSeatData = {
      inbound: this.passengerSeatMapInbound,
      outbound: this.passengerSeatMapOutbound,
      inboundPrice: this.selectedSeatPriceInbound,
      outboundPrice: this.selectedSeatPriceOutbound
    };
    this.setSeatData(allSeatData);
  }

  // โหลดข้อมูลของเที่ยวบินที่เลือก
  private loadFlightData() {
    if (this.selectedFlight === 'inbound') {
      this.selectedSeat = [...this.selectedSeatInbound];
      this.selectedSeatPrice = this.selectedSeatPriceInbound;
      this.passengerSeatMap = { ...this.passengerSeatMapInbound };
    } else {
      this.selectedSeat = [...this.selectedSeatOutbound];
      this.selectedSeatPrice = this.selectedSeatPriceOutbound;
      this.passengerSeatMap = { ...this.passengerSeatMapOutbound };
    }
    this.updateSeatMapStatus();
  }

  // อัปเดตสถานะที่นั่งใน seatMap
  private updateSeatMapStatus() {
    // รีเซ็ตสถานะทั้งหมดเป็น available
    this.seatMap.forEach(row => {
      row.forEach(seat => {
        if (seat) {
          seat.status = 'available';
        }
      });
    });
    
    // ตั้งค่าสถานะ selected สำหรับที่นั่งที่เลือกแล้ว
    this.selectedSeat.forEach(selectedSeat => {
      this.seatMap.forEach(row => {
        row.forEach(seat => {
          if (seat && seat.label === selectedSeat.label) {
            seat.status = 'selected';
          }
        });
      });
    });
  }

  updateHeaderTitle() {
    // หัวข้อจะถูกอัปเดตผ่าน template binding
    // ใช้ selectedFlight เพื่อแสดงหัวข้อที่เหมาะสม
  }

  setPassengerData() {
    console.log("setPassengerData",this.passengers);
    // แปลง array กลับเป็น object ที่มี key เป็นตัวเลข
    const passengerObject: { [key: number]: any } = {};
    this.passengers.forEach((passenger, index) => {
      passengerObject[index + 1] = passenger;
    });
    this.passDataService.setFormData(passengerObject);
  }

  setSeatData(data: any) {
    console.log("setSeatData", data);
    
    // ถ้าเป็นข้อมูลแบบใหม่ที่มี inbound และ outbound
    if (data.inbound !== undefined && data.outbound !== undefined) {
      const seatObject = {
        inbound: data.inbound,
        outbound: data.outbound,
        inboundPrice: data.inboundPrice || 0,
        outboundPrice: data.outboundPrice || 0
      };
      this.passDataService.setSeatData(seatObject);
    } else {
      // รองรับข้อมูลแบบเดิม (backward compatibility)
      const seatObject: { [key: number]: any } = {};
      data.forEach((seat: any, index: number) => {
        seatObject[index + 1] = seat;
      });
      this.passDataService.setSeatData(seatObject);
    }
  }

  setSeatDataFromMap(passengerSeatMap: {[key: number]: string}) {
    const seatObject: { [key: number]: any } = {};
    Object.keys(passengerSeatMap)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((key, idx) => {
        seatObject[idx + 1] = passengerSeatMap[Number(key)];
      });
    this.passDataService.setSeatData(seatObject);
  }

  selectSeat(seat: any) {
    console.log('จำนวนที่นั่งที่เลือกแล้ว:', this.selectedSeat.length);
    console.log('จำนวนผู้โดยสาร:', this.passengers.length);
    
    // check if seat is selected
    if (this.selectedSeat.some(s => s.label === seat.label) && seat.status === 'selected') {
      // if seat is selected, then cancel selection
      seat.status = 'available';
      
      // find passenger that has seatID and delete seatID
      const passengerIndex = Object.keys(this.passengerSeatMap).find(
        key => this.passengerSeatMap[parseInt(key)] === seat.label
      );
      if (passengerIndex) {
        delete this.passengerSeatMap[parseInt(passengerIndex)];
      }
      
      this.selectedSeat = this.selectedSeat.filter(s => s.label !== seat.label);
      this.selectedSeatPrice = this.selectedSeat.reduce((sum, s) => sum + (s.price || 0), 0);
      this.SelectedSeat = this.SelectedSeat.filter(s => s !== seat.label);

      // อัปเดตข้อมูลและ UI
      this.saveCurrentFlightData();
      this.loadFlightData();
      return;
    }
    
    // check if selected seat is more than passengers
    if (this.selectedSeat.length >= this.passengers.length) {
      console.log("ไม่สามารถเลือกที่นั่งเพิ่มได้ เนื่องจากเลือกครบจำนวนผู้โดยสารแล้ว");
      return;
    }
    
    // check if seat is exit row
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
          // check again after dialog close
          if (this.selectedSeat.length < this.passengers.length && seat.status === 'available') {
            seat.status = 'selected';
            // find first passenger that has no seatID
            const passengerIndex = this.passengers.findIndex((_, index) => !this.passengerSeatMap[index]);
            if (passengerIndex !== -1) {
              this.passengerSeatMap[passengerIndex] = seat.label;
            }
            this.selectedSeat.push(seat);
            this.SelectedSeat.push(seat.label);
            this.selectedSeatPrice = this.selectedSeat.reduce((sum, s) => sum + (s.price || 0), 0);
          }
        }
      });
      return;
    }

    // select normal seat
    if (seat.status === 'available') {
      seat.status = 'selected';
      // find first passenger that has no seatID
      const passengerIndex = this.passengers.findIndex((_, index) => !this.passengerSeatMap[index]);
      if (passengerIndex !== -1) {
        this.passengerSeatMap[passengerIndex] = seat.label;
      }
      this.selectedSeat.push(seat);
      this.SelectedSeat.push(seat.label);
      this.selectedSeatPrice = this.selectedSeat.reduce((sum, s) => sum + (s.price || 0), 0);
    }

    console.log(this.passengers);
    console.log('passengerSeatMap:', this.passengerSeatMap);
    console.log('SelectedSeat:', this.SelectedSeat);

    // อัปเดตข้อมูลและ UI ทันที
    this.saveCurrentFlightData();
    this.loadFlightData();
  }

  onNextStep() {
    // บันทึกข้อมูลปัจจุบันก่อน
    this.saveCurrentFlightData();
    
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '350px',
      disableClose: true,
      data: {
        isDialog: 'alert_select_seat'
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result.result === 'confirm') {
        this.setPassengerData();
        
        // บันทึกข้อมูลที่นั่งทั้งสองเที่ยวบิน
        const allSeatData = {
          inbound: this.passengerSeatMapInbound,
          outbound: this.passengerSeatMapOutbound,
          inboundPrice: this.selectedSeatPriceInbound,
          outboundPrice: this.selectedSeatPriceOutbound
        };
        
        this.setSeatData(allSeatData);
        this.router.navigate(['/review']);
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
        // ลบข้อมูลที่นั่งของเที่ยวบินปัจจุบันเท่านั้น
        Object.values(this.passengerSeatMap).forEach(seatID => {
          if (seatID) {
            // find seat in seatMap that match seatID
            for (const row of this.seatMap) {
              for (const seat of row) {
                if (seat && seat.label === seatID) {
                  seat.status = 'available';
                }
              }
            }
          }
        });
        
        // ลบข้อมูลของเที่ยวบินปัจจุบัน
        if (this.selectedFlight === 'inbound') {
          this.passengerSeatMapInbound = {};
          this.selectedSeatInbound = [];
          this.selectedSeatPriceInbound = 0;
        } else {
          this.passengerSeatMapOutbound = {};
          this.selectedSeatOutbound = [];
          this.selectedSeatPriceOutbound = 0;
        }
        
        this.passengerSeatMap = {};
        this.selectedSeat = [];
        this.selectedSeatPrice = 0;
        this.SelectedSeat = [];
      }
    });
  }

  confirmSelectSeat() {
    // บันทึกข้อมูลปัจจุบันก่อน
    this.saveCurrentFlightData();
    
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
          console.log("selectedSeat", this.selectedSeat);
        }
      });
    } else {
      this.setPassengerData();
      
      // บันทึกข้อมูลที่นั่งทั้งสองเที่ยวบิน
      const allSeatData = {
        inbound: this.passengerSeatMapInbound,
        outbound: this.passengerSeatMapOutbound,
        inboundPrice: this.selectedSeatPriceInbound,
        outboundPrice: this.selectedSeatPriceOutbound
      };
      
      this.setSeatData(allSeatData);
      this.router.navigate(['/review']);
    }
  }

  getPassengerNameBySeat(seat: any): string {
    // find passenger that has seatID that match seat.label
    const passengerIndex = Object.keys(this.passengerSeatMap).find(
      key => this.passengerSeatMap[parseInt(key)] === seat.label
    );
    
    if (passengerIndex !== undefined) {
      const passenger = this.passengers[parseInt(passengerIndex)];
      if (passenger) {
        return `${passenger.firstName.charAt(0)} ${passenger.lastName.charAt(0)}`;
      }
    }
    return seat.label;
  }

  // อัปเดตฟังก์ชัน hasSeat เพื่อตรวจสอบตามเที่ยวบิน
  hasSeat(passengerIndex: number): boolean {
    return !!this.passengerSeatMapInbound[passengerIndex] && !!this.passengerSeatMapOutbound[passengerIndex];
  }

  // อัปเดตฟังก์ชัน getPassengerSeatID เพื่อดึงข้อมูลตามเที่ยวบิน
  getPassengerSeatID(passengerIndex: number): string {
    if (this.selectedFlight === 'inbound') {
      return this.passengerSeatMapInbound[passengerIndex] || '';
    } else {
      return this.passengerSeatMapOutbound[passengerIndex] || '';
    }
  }

  // Method สำหรับแปลงข้อมูล Cabin Info เป็น seatMap
  transformCabinInfoToSeatMap(cabinInfoData: CabinInfoResponse): SeatMap[][] {
    const seatMap: SeatMap[][] = [];
    
    if (cabinInfoData.cabinInfos && cabinInfoData.cabinInfos.length > 0) {
      const cabinInfo = cabinInfoData.cabinInfos[0];
      
      // สร้าง array ตามจำนวน row ที่มากที่สุด
      const maxRow = Math.max(...cabinInfo.seatMaps.map(row => row.rowNumber));
      
      // สร้าง array ของ row numbers รวมแถวว่าง
      const allRowNumbers: (number | string)[] = [];
      
      for (let row = 1; row <= maxRow; row++) {
        allRowNumbers.push(row);
        
        // เพิ่มแถวว่างระหว่าง 15-16 และ 16-17
        if (row === 15) {
          allRowNumbers.push('15.5');
        }
        if (row === 16) {
          allRowNumbers.push('16.5');
        }
      }
      
      // วนลูปผ่าน row numbers ทั้งหมด
      allRowNumbers.forEach(row => {
        const seatRow: SeatMap[] = [];
        
        if (row === '15.5' || row === '16.5') {
          // แถวว่างระหว่าง 15-16 และ 16-17
          seatRow.push(null as any, null as any, null as any, null as any, null as any, null as any, null as any);
          seatMap.push(seatRow);
          return;
        }
        
        const rowNumber = row as number;
        const rowData = cabinInfo.seatMaps.find(seatRow => seatRow.rowNumber === rowNumber);
        
        if (rowData && rowData.seats.length > 0) {
          // มีข้อมูลที่นั่ง - แสดงที่นั่งปกติ
          const seatPositions = ['A', 'B', 'C', null, 'H', 'J', 'K'];
          
          seatPositions.forEach((position, index) => {
            if (position === null) {
              seatRow.push(null as any);
            } else {
              const seat = rowData.seats.find(s => s.seatLatter === position);
              if (seat) {
                const seatMapItem: SeatMap = {
                  label: seat.seatId,
                  status: seat.available ? 'available' : 'unavailable',
                  type: this.getSeatTypeByServiceCode(seat.serviceCode),
                  price: seat.amountIncludingVat,
                  exit: seat.exitSeat,
                  seatId: seat.seatId,
                  serviceCode: seat.serviceCode,
                  amount: seat.amount,
                  vat: seat.vat,
                  amountIncludingVat: seat.amountIncludingVat,
                  currency: seat.currency,
                  wingSeat: seat.wingSeat,
                  preBlockedSeat: seat.preBlockedSeat
                };
                seatRow.push(seatMapItem);
              } else {
                seatRow.push(null as any);
              }
            }
          });
        } else if (rowData && rowData.seats.length === 0) {
          // มี rowNumber แต่ seats เป็น array ว่าง - แสดงเป็นที่นั่งจองแล้ว
          const seatPositions = ['A', 'B', 'C', null, 'H', 'J', 'K'];
          
          seatPositions.forEach((position, index) => {
            if (position === null) {
              seatRow.push(null as any);
            } else {
              const seatMapItem: SeatMap = {
                label: `${rowNumber}:${position}`,
                status: 'unavailable',
                type: 'regular',
                price: 0,
                exit: false,
                seatId: `${rowNumber}:${position}`,
                serviceCode: '',
                amount: 0,
                vat: 0,
                amountIncludingVat: 0,
                currency: 'THB',
                wingSeat: false,
                preBlockedSeat: false
              };
              seatRow.push(seatMapItem);
            }
          });
        } else {
          // ไม่มีข้อมูลแถวนี้ - ใส่ null ทั้งหมด
          seatRow.push(null as any, null as any, null as any, null as any, null as any, null as any, null as any);
        }
        
        seatMap.push(seatRow);
      });
    }
    
    return seatMap;
  }

  // Method สำหรับกำหนดประเภทที่นั่งตาม serviceCode
  private getSeatTypeByServiceCode(serviceCode: string): string {
    switch (serviceCode) {
      case 'S500':
        return 'premium-plus';
      case 'S300':
        return 'premium';
      default:
        return 'regular';
    }
  }

  // Method สำหรับอัปเดตข้อมูลที่นั่งจาก Cabin Info
  updateSeatMapFromCabinInfo2(cabinInfoResponse: CabinInfoResponse) {
    this.cabinInfoData = cabinInfoResponse;
    console.log("cabinInfoResponse", cabinInfoResponse);
    console.log("cabinInfoData", this.cabinInfoData);
    this.seatMap = this.transformCabinInfoToSeatMap(cabinInfoResponse);
    console.log('Updated seat map from API:', this.seatMap);
  }

  // แยก method สำหรับ subscribe getSeatData
  subscribeToSeatData() {
    this.passDataService.getSeatData().subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        // กรณีมี inbound/outbound
        let selectedSeatLabels: string[] = [];
        if (data.inbound !== undefined && data.outbound !== undefined) {
          // สมมติว่าอยู่หน้า inbound
          const seatMapObj = this.selectedFlight === 'inbound' ? data.inbound : data.outbound;
          selectedSeatLabels = Object.values(seatMapObj || {});
          // อัปเดต passengerSeatMap ตามเที่ยวบิน
          this.passengerSeatMap = { ...seatMapObj };
        } else {
          // กรณีข้อมูลแบบเดิม
          selectedSeatLabels = Array.isArray(data) ? data : Object.values(data);
          this.passengerSeatMap = {};
          if (Array.isArray(data)) {
            data.forEach((seatLabel, index) => {
              this.passengerSeatMap[index] = seatLabel;
            });
          } else {
            Object.keys(data).forEach((passengerIndex) => {
              const index = parseInt(passengerIndex) - 1;
              this.passengerSeatMap[index] = data[passengerIndex];
            });
          }
        }

        // อัปเดต SelectedSeat
        this.SelectedSeat = selectedSeatLabels;

        // อัปเดตสถานะที่นั่งใน seatMap
        for (const row of this.seatMap) {
          for (const seat of row) {
            if (!seat) continue;
            if (selectedSeatLabels.includes(seat.label)) {
              seat.status = 'selected';
            } else if (seat.status === 'selected') {
              seat.status = 'available';
            }
          }
        }

        // อัปเดต selectedSeat array และ selectedSeatPrice
        this.selectedSeat = [];
        this.selectedSeatPrice = 0;
        selectedSeatLabels.forEach(seatLabel => {
          for (const row of this.seatMap) {
            for (const seat of row) {
              if (seat && seat.label === seatLabel) {
                this.selectedSeat.push(seat);
                this.selectedSeatPrice += seat.price || 0;
                break;
              }
            }
          }
        });
      }
    });
  }

  // อัปเดต method updateSeatMapFromCabinInfo เพื่อเรียก subscribeToSeatData หลังจากอัปเดต seatMap
  updateSeatMapFromCabinInfo(cabinInfoResponse: CabinInfoResponse) {
    this.cabinInfoData = cabinInfoResponse;
    this.seatMap = this.transformCabinInfoToSeatMap(cabinInfoResponse);
    console.log("seatMap", this.seatMap);

    // หา seat ตัวอย่างแต่ละประเภท
    const allSeats = this.seatMap.flat().flat().filter((seat): seat is SeatMap => !!seat);
    this.premiumPlusPrice = allSeats.find(seat => seat.type === 'premium-plus')?.price || 0;
    this.premiumPrice = allSeats.find(seat => seat.type === 'premium')?.price || 0;
    this.regularPrice = allSeats.find(seat => seat.type === 'regular')?.price || 0;

    this.subscribeToSeatData();
  }
}
