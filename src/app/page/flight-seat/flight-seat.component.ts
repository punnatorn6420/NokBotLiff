import { Component, ElementRef, Input, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PassDataService } from '../../core/services/pass-data.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

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
  seatLetter: string;
  wingSeat: boolean;
  exitSeat: boolean;
  preBlockedSeat: boolean;
  serviceCode: string;
  amount: number;
  vatAmount: number;
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
  @ViewChild('passengerScroll', { static: false }) passengerScrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChildren('passengerBox') passengerBoxes?: QueryList<ElementRef<HTMLDivElement>>;


  // --- กำหนดตัวแปรสำหรับ segment ---
  segmentList: Array<{
    key: string; // เช่น 'inbound1', 'inbound2', 'outbound1', 'outbound2'
    label: string; // สำหรับแสดงผล
  }> = [];
  currentSegmentKey: string = '';
  segmentSeatMap: { [segmentKey: string]: { [passengerIndex: number]: string } } = {};
  segmentSelectedSeat: { [segmentKey: string]: any[] } = {};
  segmentSelectedSeatPrice: { [segmentKey: string]: number } = {};

  // --- ตัวแปรเดิม (ใช้กับ segment ปัจจุบัน) ---
  selectedSeat: any[] = [];
  selectedSeatPrice: number = 0;
  passengerSeatMap: { [passengerIndex: number]: string } = {};
  SelectedSeat: any[] = [];
  formData: Passenger[] = [];
  passengers: Passenger[] = [];
  // ชี้ผู้โดยสารที่ถูกเลือกด้วยการคลิก (หาก null จะเลือกอัตโนมัติตามลำดับถัดไป)
  selectedPassengerIndex: number | null = null;
  isLoading: boolean = false;
  isShowDetailSeatPrice: boolean = false;
  freeSeatOutbound: boolean = false;
  freeSeatInbound: boolean = false;
  clickConfirmAddSeat:boolean = false;
  // บันทึกว่าผู้ใช้กด "สนใจ" สำหรับ upsell ที่นั่งแล้ว แยกตามทิศทาง
  private acknowledgedUpsellByDirection: { outbound: boolean; inbound: boolean } = { outbound: false, inbound: false };
  // ป้องกันการกระโดด segment อัตโนมัติทันทีหลังสลับทิศทาง
  // private skipAutoNavigateOnce: boolean = false;

  journeyKeyOutbound: string = '';
  farKeyOutbound: string = '';
  journeyKeyInbound: string = '';
  farKeyInbound: string = '';
  
  // ตัวแปรเก็บข้อมูล seatmap แยกตาม outbound และ inbound
  outboundSeatMap: any[][] = [];
  inboundSeatMap: any[][] = [];
  // เก็บ seatmap แบบแยกตาม segment (เช่น outbound1, outbound2)
  outboundSeatMaps: any[][][] = [];
  inboundSeatMaps: any[][][] = [];

  isConnectFlight: boolean = true;
  hasInbound: boolean = true;
  hasOutbound: boolean = true;
  connectFlightCountInbound: number = 0;
  connectFlightCountOutbound: number = 0;

  tripType: string = '';
  selectedFlight: string = 'outbound';
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

    this.passDataService.getPassengerInfo().subscribe((data: any) => {
      if (data.flight_search.trip_type === "one-way") { 
        this.tripType = "one-way";
        this.journeyKeyOutbound = data.outbound_flight_select.journey_key;
        this.farKeyOutbound = data.outbound_flight_select.fare_key;
        
        // เช็ค service bundle สำหรับ outbound
        const outboundServiceNameOneWay = (data.outbound_flight_select.service_bundle?.serviceName || '').trim();
        if (outboundServiceNameOneWay) {
          this.freeSeatOutbound = true;
        } else {
          this.freeSeatOutbound = false;
        }
      } else if (data.flight_search.trip_type === "round-trip") {
        this.tripType = "round-trip";
        this.journeyKeyOutbound = data.outbound_flight_select.journey_key;
        this.farKeyOutbound = data.outbound_flight_select.fare_key;
        this.journeyKeyInbound = data.inbound_flight_select.journey_key;
        this.farKeyInbound = data.inbound_flight_select.fare_key;
        
        // เช็ค service bundle สำหรับ outbound
        const outboundServiceNameRoundTrip = (data.outbound_flight_select.service_bundle?.serviceName || '').trim();
        if (outboundServiceNameRoundTrip) {
          this.freeSeatOutbound = true;
        } else {
          this.freeSeatOutbound = false;
        }
        
        // เช็ค service bundle สำหรับ inbound
        const inboundServiceNameRoundTrip = (data.inbound_flight_select.service_bundle?.serviceName || '').trim();
        if (inboundServiceNameRoundTrip) {
          this.freeSeatInbound = true;
        } else {
          this.freeSeatInbound = false;
        }
      }

      if (this.journeyKeyInbound && this.journeyKeyOutbound) {
        this.isConnectFlight = true;
      } else {
        this.isConnectFlight = false;
      }

      if (this.journeyKeyInbound) {
        this.hasInbound = true;
      } else {
        this.hasInbound = false;
      }

      if (this.journeyKeyOutbound) {
        this.hasOutbound = true;
      } else {
        this.hasOutbound = false;
      }

      if (data.flight_search.trip_type === "one-way") {
        if (data.outbound_flight_select.flight_detail.length > 1) {
          this.connectFlightCountOutbound = 2;
          this.isConnectFlight = true;
        }else{
          this.connectFlightCountOutbound = 1;
          this.isConnectFlight = false;
        }
      } else if (data.flight_search.trip_type === "round-trip") {
        if (data.outbound_flight_select.flight_detail.length > 1) {
          this.connectFlightCountOutbound = 2;
          this.isConnectFlight = true;
        }else{
          this.connectFlightCountOutbound = 1;
          this.isConnectFlight = false;
        }

      }
      // --- ตรวจสอบประเภทเที่ยวบินและเตรียม segment ---
      this.setupSegments();
      this.currentSegmentKey = (this.segmentList[0]?.key || '').trim();
      
      // โหลดข้อมูล seatmap สำหรับ outbound และ inbound
      this.loadSeatMapData();
    });

    // --- โหลดข้อมูลผู้โดยสาร ---
    this.passDataService.getFormData().subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        this.formData = data as Passenger[];
        this.passengers = Object.values(this.formData);
      } else {
        this.formData = [];
        this.passengers = []; 
      }
    });
  }


  // อัปเดตสถานะที่นั่งใน seatMap
  private updateSeatMapStatus() {
    
    // ทำ reverse map: label -> passengerIndex สำหรับ segment ปัจจุบัน
    const labelToPassengerIndex: { [label: string]: number } = {};
    Object.keys(this.passengerSeatMap).forEach((pIdxStr: string) => {
      const label = this.passengerSeatMap[parseInt(pIdxStr, 10)];
      if (label) labelToPassengerIndex[label] = parseInt(pIdxStr, 10);
    });

    // รีเซ็ตสถานะทั้งหมดเป็น available เฉพาะที่นั่งที่ไม่ได้ถูกบล็อกจาก API
    this.seatMap.forEach(row => {
      row.forEach(seat => {
        if (seat) {
          // รักษาที่นั่งที่สถานะ 'unavailable' (เช่น แถวที่ไม่มีใน API หรือถูกบล็อก) ไว้
          if (seat.status !== 'unavailable') {
            seat.status = 'available';
          }
          // ล้างข้อมูลผู้เลือกเดิมก่อนคำนวณใหม่
          if ((seat as any).selectedByPassengerIndex !== undefined) {
            delete (seat as any).selectedByPassengerIndex;
          }
        }
      });
    });
    
    // ตั้งค่าสถานะ selected สำหรับที่นั่งที่เลือกแล้ว
    this.selectedSeat.forEach(selectedSeat => {
      this.seatMap.forEach(row => {
        row.forEach(seat => {
          if (seat && seat.label === selectedSeat.label) {
            seat.status = 'selected';
            // ระบุว่าใครเลือกที่นั่งนี้
            (seat as any).selectedByPassengerIndex = labelToPassengerIndex[selectedSeat.label];
          }
        });
      });
    });
    
  }

  

  setSeatData(data: any) {
    
    // ถ้าเป็นข้อมูลแบบใหม่ที่มี segment data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // ข้อมูลแบบ segment (inbound1, inbound2, outbound1, outbound2)
      this.passDataService.setSeatData(data);
    } else if (Array.isArray(data)) {
      // รองรับข้อมูลแบบเดิม (backward compatibility)
      const seatObject: { [key: number]: any } = {};
      data.forEach((seat: any, index: number) => {
        seatObject[index + 1] = seat;
      });
      this.passDataService.setSeatData(seatObject);
    } else {
      // กรณีอื่นๆ
      this.passDataService.setSeatData(data);
    }
  }

  goToPassengerForm() {
    this.saveAllSegmentData();
    this.router.navigate(['/form']);
  }


  getPassengerNameBySeat(seat: any): string {
    // find passenger that has seatID that match seat.label
    const passengerIndex = Object.keys(this.passengerSeatMap).find(
      key => this.passengerSeatMap[parseInt(key)] === seat.label
    );
    
    if (passengerIndex !== undefined) {
      const passenger = this.passengers[parseInt(passengerIndex)];
      if (passenger) {
        // หากเป็นผู้โดยสาร Infant ให้ไม่แสดงชื่อ
        if (this.isInfant(parseInt(passengerIndex))) {
          return seat.label;
        }
        return `${passenger.firstName.charAt(0)} ${passenger.lastName.charAt(0)}`;
      }
    }
    return seat.label;
  }

  

  // ฟังก์ชันเช็คว่าผู้โดยสารเลือกที่นั่งครบใน connect flight หรือไม่
  hasSeatInServiceSegments(passengerIndex: number): boolean {
    // เช็คว่าผู้โดยสารเลือกที่นั่งครบใน segment ปัจจุบันหรือไม่
    const segmentSeatMap = this.segmentSeatMap[this.currentSegmentKey] || {};
    const passengerSeat = segmentSeatMap[passengerIndex];
    
    return !!passengerSeat;
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
              const seat = rowData.seats.find(s => s.seatLetter === position);
              if (seat) {
                const seatMapItem: SeatMap = {
                  label: seat.seatId.replace(/:/g, ' '),
                  status: seat.available ? 'available' : 'unavailable',
                  type: this.getSeatTypeByServiceCode(seat.serviceCode),
                  price: seat.amountIncludingVat,
                  exit: seat.exitSeat,
                  seatId: seat.seatId,
                  serviceCode: seat.serviceCode,
                  amount: seat.amount,
                  vat: seat.vatAmount,
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
                label: `${rowNumber} ${position}`,
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

  

  // getSeatData
  subscribeToSeatData() {
    this.passDataService.getSeatData().subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        // โหลดข้อมูลทุก segment
        this.loadAllSegmentData(data);
        
        // โหลดข้อมูล segment ปัจจุบัน
        this.loadSegmentData();
        
      } else {
        this.loadSegmentData();
        
      }
    });
  }

  // --- ฟังก์ชันตรวจสอบประเภทเที่ยวบินและเตรียม segment ---
  setupSegments() {
    this.segmentList = [];
    
    try {
      const flightData = this.passDataService.getFlightData();
      if (!flightData) {
        console.warn('No flight data available for setupSegments');
        return;
      }

      // ตรวจสอบข้อมูล outbound flights
      if (flightData.outbound_flight_select?.flight_detail) {
        const outboundFlights = flightData.outbound_flight_select.flight_detail;
        for (let i = 1; i <= outboundFlights.length; i++) {
          const flightDetail = outboundFlights[i - 1];
          const flightNumber = flightDetail.flightNumber || `DD${100 + i}`;
          this.segmentList.push({ 
            key: `outbound${i}`, 
            label: `ขาไป ${flightNumber}` 
          });
        }
      }

      // ตรวจสอบข้อมูล inbound flights (สำหรับ round-trip)
      if (flightData.inbound_flight_select?.flight_detail) {
        const inboundFlights = flightData.inbound_flight_select.flight_detail;
        for (let i = 1; i <= inboundFlights.length; i++) {
          const flightDetail = inboundFlights[i - 1];
          const flightNumber = flightDetail.flightNumber || `DD${200 + i}`;
          this.segmentList.push({ 
            key: `inbound${i}`, 
            label: `ขากลับ ${flightNumber}` 
          });
        }
      }

      // เตรียมตัวแปรเก็บข้อมูลแต่ละ segment
      this.segmentList.forEach(seg => {
        if (!this.segmentSeatMap[seg.key]) this.segmentSeatMap[seg.key] = {};
        if (!this.segmentSelectedSeat[seg.key]) this.segmentSelectedSeat[seg.key] = [];
        if (!this.segmentSelectedSeatPrice[seg.key]) this.segmentSelectedSeatPrice[seg.key] = 0;
      });

    } catch (error) {
      console.error('Error in setupSegments:', error);
    }
  }

  // --- ฟังก์ชันเปลี่ยน segment ---
  switchSegment(segmentKey: string) {
    this.saveCurrentSegmentData();
    this.currentSegmentKey = (segmentKey || '').trim();
    this.loadSegmentData();
  }

  // --- บันทึกข้อมูล segment ปัจจุบัน ---
  saveCurrentSegmentData() {
    this.segmentSeatMap[this.currentSegmentKey] = { ...this.passengerSeatMap };
    this.segmentSelectedSeat[this.currentSegmentKey] = [...this.selectedSeat];
    this.segmentSelectedSeatPrice[this.currentSegmentKey] = this.selectedSeatPrice;
  }

  // --- โหลดข้อมูล segment ปัจจุบัน ---
  loadSegmentData() {
    this.passengerSeatMap = { ...this.segmentSeatMap[this.currentSegmentKey] };
    
    // อัปเดต SelectedSeat array
    this.SelectedSeat = Object.values(this.passengerSeatMap).filter(seatId => !!seatId);
    
    // เปลี่ยน seatmap ตาม segment ที่เลือก
    this.updateSeatMapForCurrentSegment();
    
    // เคลียร์ที่นั่งที่ถูกจับจอง/ไม่ว่างแล้วหลังโหลด seat map ใหม่
    // หากที่นั่งของผู้โดยสารไม่อยู่ใน seatMap ปัจจุบัน หรือสถานะเป็น 'unavailable' ให้ลบออก
    let passengerSeatMapChanged = false;
    Object.keys(this.passengerSeatMap).forEach((pIdxStr: string) => {
      const pIdx = parseInt(pIdxStr, 10);
      const seatLabel = this.passengerSeatMap[pIdx];
      if (!seatLabel) return;
      let foundSeat: any = null;
      for (const row of this.seatMap) {
        for (const seat of row) {
          if (seat && seat.label === seatLabel) {
            foundSeat = seat;
            break;
          }
        }
        if (foundSeat) break;
      }
      if (!foundSeat || foundSeat.status === 'unavailable') {
        delete this.passengerSeatMap[pIdx];
        passengerSeatMapChanged = true;
      }
    });
    if (passengerSeatMapChanged) {
      this.segmentSeatMap[this.currentSegmentKey] = { ...this.passengerSeatMap };
      // อัปเดต SelectedSeat array ให้สอดคล้องหลังการล้าง
      this.SelectedSeat = Object.values(this.passengerSeatMap).filter(seatId => !!seatId);
    }

    // สร้าง selectedSeat array จาก passengerSeatMap และ seatMap ปัจจุบัน
    this.selectedSeat = [];
    Object.values(this.passengerSeatMap).forEach(seatLabel => {
      if (seatLabel) {
        for (const row of this.seatMap) {
          for (const seat of row) {
            if (seat && seat.label === seatLabel) {
              this.selectedSeat.push(seat);
              break;
            }
          }
        }
      }
    });
    
    // อัปเดตสถานะที่นั่งใน seatMap
    this.updateSeatMapStatus();
    
    // คำนวณราคาตาม service bundle หลังจากมี selectedSeat แล้ว
    this.selectedSeatPrice = this.calculateCurrentSegmentPrice();
    
    // อัปเดตข้อมูลใน segmentSelectedSeat และ segmentSelectedSeatPrice
    this.segmentSelectedSeat[this.currentSegmentKey] = [...this.selectedSeat];
    this.segmentSelectedSeatPrice[this.currentSegmentKey] = this.selectedSeatPrice;
    // อัปเดตรายการผู้โดยสารสำหรับแสดงผลตามสิทธิ์ bundle ของ segment ปัจจุบัน
    

    // เลื่อนรายการผู้โดยสารไปยังคนที่กำลังเลือกอยู่
    this.scrollSelectingPassengerIntoView();
  }

  // อัปเดต seatmap ตาม segment ปัจจุบัน
  updateSeatMapForCurrentSegment() {
    
    if (this.currentSegmentKey.startsWith('outbound')) {
      // ใช้ seatmap ของ outbound
      const segIdx = (parseInt(this.currentSegmentKey.replace(/\D/g, ''), 10) || 1) - 1;
      const segSeatMap = this.outboundSeatMaps[segIdx];
      if (segSeatMap && segSeatMap.length > 0) {
        this.seatMap = JSON.parse(JSON.stringify(segSeatMap));
      } else if (this.outboundSeatMap.length > 0) {
        this.seatMap = JSON.parse(JSON.stringify(this.outboundSeatMap)); // fallback: เดิม
      } else {
      }
    } else if (this.currentSegmentKey.startsWith('inbound')) {
      // ใช้ seatmap ของ inbound
      const segIdx = (parseInt(this.currentSegmentKey.replace(/\D/g, ''), 10) || 1) - 1;
      const segSeatMap = this.inboundSeatMaps[segIdx];
      if (segSeatMap && segSeatMap.length > 0) {
        this.seatMap = JSON.parse(JSON.stringify(segSeatMap));
      } else if (this.inboundSeatMap.length > 0) {
        this.seatMap = JSON.parse(JSON.stringify(this.inboundSeatMap)); // fallback: เดิม
      } else {
      }
    }
  }

  // --- โหลดข้อมูลทุก segment จากข้อมูลที่บันทึกไว้ ---
  loadAllSegmentData(data: any) {
    
    this.segmentList.forEach(seg => {
      // โหลดข้อมูลที่นั่งของแต่ละ segment
      this.segmentSeatMap[seg.key] = data[seg.key] || {};
      
      // โหลดข้อมูลราคาของแต่ละ segment
      this.segmentSelectedSeatPrice[seg.key] = data[`${seg.key}Price`] || 0;
      
      // โหลดข้อมูลที่นั่งที่เลือกของแต่ละ segment
      this.segmentSelectedSeat[seg.key] = data[`${seg.key}SelectedSeat`] || [];
      
    });
  }

  // --- ฟังก์ชันบันทึกข้อมูลที่นั่งทุก segment ---
  saveAllSegmentData() {
    this.saveCurrentSegmentData();
    const allSeatData: any = {};
    this.segmentList.forEach(seg => {
      allSeatData[seg.key] = this.segmentSeatMap[seg.key];
      allSeatData[`${seg.key}Price`] = this.segmentSelectedSeatPrice[seg.key];
      allSeatData[`${seg.key}SelectedSeat`] = this.segmentSelectedSeat[seg.key];
    });
    this.setSeatData(allSeatData);
  }


    // ตรวจสอบว่าผู้โดยสารมีสิทธิ์ S150 สำหรับทิศทางที่ระบุหรือไม่
    private passengerHasS150Bundle(passengerIndex: number, direction: 'outbound' | 'inbound'): boolean {
      const passenger: any = this.passengers && this.passengers[passengerIndex];
      if (!passenger) return false;
      const bundle = direction === 'inbound' ? passenger?.returnBundle : passenger?.outboundBundle;
      if (!bundle) return false;
      if (Array.isArray(bundle.details)) {
        return bundle.details.some((d: any) => d?.serviceCode === 'S150');
      }
      if (bundle?.serviceCodeDetail === 'S150') return true;
      return false;
    }
  
    // หาทิศทางจาก segment key
    private getDirectionFromSegmentKey(segmentKey: string): 'outbound' | 'inbound' {
      return segmentKey.startsWith('inbound') ? 'inbound' : 'outbound';
    }
  
    // หา index ผู้โดยสารถัดไปที่ยังไม่ได้เลือกที่นั่งใน segment ปัจจุบัน
    private getNextUnassignedPassengerIndex(): number {
      // เลือกผู้โดยสารที่ยังไม่ได้เลือกที่นั่งและมี Bundle ตามทิศทางปัจจุบันก่อน (ข้าม Infant)
      const prioritized = this.passengers.findIndex((_, index) => !this.passengerSeatMap[index] && !this.isInfant(index) && this.hasServiceBundle(index));
      if (prioritized !== -1) return prioritized;
      // หากไม่มี ให้คืนค่าแรกที่ยังไม่ได้เลือกตามลำดับเดิม (ข้าม Infant)
      return this.passengers.findIndex((_, index) => !this.passengerSeatMap[index] && !this.isInfant(index));
    }

  // --- ฟังก์ชันเลือกที่นั่ง (selectSeat) ใช้ logic เดิม ---
  selectSeat(seat: any) {
    if (seat.status === 'selected') {
      // ยกเลิกการเลือกที่นั่ง
      seat.status = 'available';
      if ((seat as any).selectedByPassengerIndex !== undefined) {
        delete (seat as any).selectedByPassengerIndex;
      }
      const passengerIndex = Object.keys(this.passengerSeatMap).find(
        key => this.passengerSeatMap[parseInt(key)] === seat.label
      );
      if (passengerIndex) {
        delete this.passengerSeatMap[parseInt(passengerIndex)];
      }
      this.selectedSeat = this.selectedSeat.filter(s => s.label !== seat.label);
      
      // คำนวณราคาตาม service bundle
      this.selectedSeatPrice = this.calculateCurrentSegmentPrice();
      
      this.SelectedSeat = this.SelectedSeat.filter(s => s !== seat.label);
      this.saveCurrentSegmentData();
      this.loadSegmentData();
      return;
    }
    
    if (this.selectedSeat.length >= this.getSeatEligibleCount()) {
      return;
    }

    // ตรวจสอบที่นั่ง exit ก่อน
    if (seat.exit && seat.status === 'available') {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_exit' }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          this.selectSeatAfterConfirmation(seat);
        }
      });
      return;
    }

    // เลือกที่นั่งปกติ (ไม่ใช่ exit seat)
    this.selectSeatAfterConfirmation(seat);
  }

  // ลบที่นั่งของผู้โดยสารตาม index (กดปุ่ม X ที่รายการผู้โดยสาร)
  onRemoveSeat(passengerIndex: number, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const seatLabel = this.passengerSeatMap[passengerIndex];
    if (!seatLabel) return;

    // อัปเดตสถานะที่นั่งใน seatMap ให้ available
    for (const row of this.seatMap) {
      for (const seat of row) {
        if (seat && seat.label === seatLabel) {
          seat.status = 'available';
          if ((seat as any).selectedByPassengerIndex !== undefined) {
            delete (seat as any).selectedByPassengerIndex;
          }
        }
      }
    }

    // ลบ mapping และลิสต์ที่นั่งที่เลือก
    delete this.passengerSeatMap[passengerIndex];
    this.selectedSeat = this.selectedSeat.filter(s => s.label !== seatLabel);
    this.SelectedSeat = this.SelectedSeat.filter(l => l !== seatLabel);

    // คำนวณราคาใหม่และบันทึกข้อมูล segment
    this.selectedSeatPrice = this.calculateCurrentSegmentPrice();
    this.saveCurrentSegmentData();
    this.loadSegmentData();
  }

  // เพิ่มฟังก์ชันใหม่สำหรับเลือกที่นั่งหลังจากยืนยันแล้ว
  selectSeatAfterConfirmation(seat: any) {
    const seatType = this.getSeatTypeByServiceCode(seat.serviceCode);
    // ตรวจสอบสิทธิ์ S150 ของผู้โดยสารที่กำลังจะถูกกำหนดที่นั่ง (รายคน/ตามทิศทาง)
    const nextPassengerIndex = this.getTargetPassengerIndexForSelection();
    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    const hasS150Entitlement = nextPassengerIndex !== -1 && this.passengerHasS150Bundle(nextPassengerIndex, direction);

    // ถ้าผู้โดยสารมีสิทธิ์ S150 แต่เลือกที่นั่งที่ไม่ใช่ S150 ให้แสดง dialog แจ้งเตือน
    if (hasS150Entitlement && seat.serviceCode !== 'S150') {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_select_not_include_package' }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          this.selectSeatFinal(seat);
        }
      });
      return;
    }
    
    // เลือกที่นั่งปกติ
    this.selectSeatFinal(seat);
  }

  // เพิ่มฟังก์ชันใหม่สำหรับเลือกที่นั่งขั้นสุดท้าย
  selectSeatFinal(seat: any) {
    // อนุญาตให้สลับที่นั่งสำหรับผู้โดยสารที่ถูกเลือก แม้จะเลือกครบทุกคนแล้ว
    if (seat.status !== 'available') return;
    const passengerIndex = this.getTargetPassengerIndexForSelection();
    if (passengerIndex === -1 && this.selectedSeat.length >= this.getSeatEligibleCount()) return;
    // ป้องกันไม่ให้กำหนดที่นั่งให้ผู้โดยสารที่เป็น Infant
    if (passengerIndex !== -1 && this.isInfant(passengerIndex)) return;
    if (passengerIndex !== -1) {
      seat.status = 'selected';

      // หากผู้โดยสารนี้มีที่นั่งเดิมอยู่แล้ว ให้ปลดที่นั่งเดิมก่อน
      const oldSeatLabel = this.passengerSeatMap[passengerIndex];
      if (oldSeatLabel && oldSeatLabel !== seat.label) {
        // อัปเดตสถานะของที่นั่งเดิมให้ว่าง
        for (const row of this.seatMap) {
          for (const s of row) {
            if (s && s.label === oldSeatLabel) {
              s.status = 'available';
              if ((s as any).selectedByPassengerIndex !== undefined) {
                delete (s as any).selectedByPassengerIndex;
              }
            }
          }
        }
        // ลบออกจากรายการที่เลือก
        this.selectedSeat = this.selectedSeat.filter(s => s.label !== oldSeatLabel);
        this.SelectedSeat = this.SelectedSeat.filter(l => l !== oldSeatLabel);
      }

      // กำหนดที่นั่งใหม่ให้ผู้โดยสารที่ถูกเลือก
      this.passengerSeatMap[passengerIndex] = seat.label;
      (seat as any).selectedByPassengerIndex = passengerIndex;
      this.selectedSeat.push(seat);
      this.SelectedSeat.push(seat.label);
      
      // คำนวณราคาตาม service bundle
      this.selectedSeatPrice = this.calculateCurrentSegmentPrice();
      
      this.saveCurrentSegmentData();
      this.loadSegmentData();
      this.scrollSelectingPassengerIntoView();

      // รีเซ็ตตัวเลือกผู้โดยสารให้กลับไปโหมดอัตโนมัติหลังจากเลือกสำเร็จ
      this.selectedPassengerIndex = null;
    }
  }

  onNextStep() {
    this.saveAllSegmentData();
     // ผู้โดยสารที่มีสิทธิ์ (bundle) แต่ยังเลือกไม่ครบ ให้แสดง Dialog บังคับเลือกที่นั่ง
     const earlyDirection = this.isInboundDirection() ? 'inbound' : 'outbound';
     const earlyEntitledCount = this.getEntitledPassengerIndexes(earlyDirection).length;
     const hasUnselectedServiceInDirection = earlyEntitledCount > 0 && this.getCurrentDirectionSegments().some(seg => {
       const selectedForEntitled = this.getEntitledSelectedCountForSegment(seg.key);
       return selectedForEntitled < earlyEntitledCount;
     });
     if (hasUnselectedServiceInDirection) {
       const targetSeg = this.findFirstIncompleteEntitlementSegmentInCurrentDirection();
       if (targetSeg && targetSeg !== this.currentSegmentKey) {
         this.switchSegment(targetSeg);
         return;
       }
       this.dialog.open(DialogComponent, {
         width: '350px',
         disableClose: true,
         data: { isDialog: 'alert_select_seat' }
       });
       return;
     }


    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    // หา passenger ที่ไม่มี bundle และยังไม่ได้เลือกที่นั่งในทิศทางปัจจุบัน (เสนอขายที่นั่ง)
    const currentSegs = this.getCurrentDirectionSegments();
    const nonBundleIdxs = this.passengers
      .map((_, idx) => idx)
      .filter(idx => !this.isInfant(idx) && !this.passengerHasS150Bundle(idx, direction));
    const unseatedNonBundleIdxs = nonBundleIdxs.filter(idx => {
      // ต้องมีที่นั่งครบทุก segment ของทิศทางปัจจุบัน จึงถือว่าเลือกครบ
      const isFullySeatedInDirection = currentSegs.every(seg => {
        const seatMap = this.segmentSeatMap[seg.key] || {};
        return !!seatMap[idx];
      });
      return !isFullySeatedInDirection;
    });

    // แสดง upsell เฉพาะเมื่ออยู่ context สุดท้าย และไม่มีการเลือกใดๆ โดยผู้ไม่มี bundle มาก่อน
    const isFinalContext = this.isFinalContextForUpsell();
    const hasAnyNonBundleSelectionAnywhere = this.hasAnySeatSelectedByNonBundlePassengersAnywhere();

    if (isFinalContext && unseatedNonBundleIdxs.length > 0 && !this.acknowledgedUpsellByDirection[direction] && !hasAnyNonBundleSelectionAnywhere) {
      const message = unseatedNonBundleIdxs
        .map(i => `${this.passengers[i].firstName} ${this.passengers[i].lastName}`)
        .join(', ');
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_select_seat_not_include_package', message }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result && result.result === 'confirm') {
          this.acknowledgedUpsellByDirection[direction] = true;
          // สลับไปยัง segment แรกสุดของ direction แรกที่ยังไม่เลือกสำหรับผู้ไม่มี bundle
          const targetSeg = this.findFirstSegmentWithUnseatedNonBundleAcrossDirections();
          if (targetSeg && targetSeg !== this.currentSegmentKey) {
            this.switchSegment(targetSeg);
            return;
          }
        } else {
          // ไม่สนใจ: ไปหน้าถัดไป (context สุดท้ายแล้ว)
          if (this.isInboundDirection() || !this.hasInbound) {
            if (this.enforceAllServiceBundlesSelectedOrRedirect()) return;
            this.router.navigate(['/review']);
          } else {
            this.switchDirection('inbound');
          }
        }
      });
      return;
    }

    // แจ้งเตือนกรณีผู้มีสิทธิ์ bundle เลือกที่นั่งที่ไม่รวมในแพ็กเกจ (เช่น S300/S500)
    const directionForWarn = this.isInboundDirection() ? 'inbound' : 'outbound';
    const nonIncludedIdxs = this.getEntitledNonIncludedPassengerIndexesByDirection(directionForWarn);
    if (nonIncludedIdxs.length > 0) {
      const names = nonIncludedIdxs.map(i => this.getPassengerFullName(i)).join(', ');
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_select_not_include_package', message: names }
      });
      dialogRef.afterClosed().subscribe(() => {
        // ดำเนินการต่อไปตาม flow ปกติหลังยืนยันการรับทราบ
        const nextSegTmp = this.getNextSegmentInCurrentDirection();
        if (nextSegTmp) {
          this.switchSegment(nextSegTmp);
        } else if (this.isInboundDirection() || !this.hasInbound) {
          if (this.enforceAllServiceBundlesSelectedOrRedirect()) return;
          this.router.navigate(['/review']);
        } else {
          this.switchDirection('inbound');
        }
      });
      return;
    }

    // หากมีการซื้อที่นั่งเพิ่มใน Outbound หรือ Inbound ใดๆ ให้แสดงแจ้งเตือนก่อน
    const paidOutboundIdxs = this.getPaidPassengerIndexesByDirection('outbound');
    const paidInboundIdxs = this.getPaidPassengerIndexesByDirection('inbound');
    if (paidOutboundIdxs.length > 0 && paidInboundIdxs.length > 0) {
      // ทั้งสองขามีค่าใช้จ่าย -> แสดงและไปหน้ารีวิว (พฤติกรรมเดิม)
      const paidOutboundNames = paidOutboundIdxs.map(i => this.getPassengerFullName(i));
      const paidInboundNames = paidInboundIdxs.map(i => this.getPassengerFullName(i));
      const message = this.buildChargeMessage(paidOutboundNames, paidInboundNames);
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_charge_additional_seat', message }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          this.router.navigate(['/review']);
        }
      });
      return;
    } else if (paidOutboundIdxs.length > 0 || paidInboundIdxs.length > 0) {
      // อย่างน้อยหนึ่งขามีค่าใช้จ่าย -> เตือนให้รับทราบ แล้วดำเนิน flow ปกติ
      const paidOutboundNames = paidOutboundIdxs.map(i => this.getPassengerFullName(i));
      const paidInboundNames = paidInboundIdxs.map(i => this.getPassengerFullName(i));
      const message = this.buildChargeMessage(paidOutboundNames, paidInboundNames);
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_charge_additional_seat', message }
      });
      dialogRef.afterClosed().subscribe(() => {
        const nextSegTmp = this.getNextSegmentInCurrentDirection();
        if (nextSegTmp) {
          this.switchSegment(nextSegTmp);
          return;
        }
        if (this.isInboundDirection() || !this.hasInbound) {
          if (this.enforceAllServiceBundlesSelectedOrRedirect()) return;
          this.router.navigate(['/review']);
        } else {
          this.switchDirection('inbound');
        }
      });
      return;
    }

    // ไม่มี dialog ใดๆ ให้สลับไป segment ถัดไปในทิศทางเดียวกันก่อน หากหมดแล้วค่อยไปทิศทางถัดไป
    const nextSeg = this.getNextSegmentInCurrentDirection();
    if (nextSeg) {
      this.switchSegment(nextSeg);
      return;
    }
    if (this.isInboundDirection() || !this.hasInbound) {
      if (this.enforceAllServiceBundlesSelectedOrRedirect()) return;
      this.router.navigate(['/review']);
    } else {
      this.switchDirection('inbound');
    }
  }

  // --- ฟังก์ชันยืนยันเลือกที่นั่ง ---
  confirmSelectSeat() {
    this.saveAllSegmentData();
    // ผู้โดยสารที่มีสิทธิ์ (bundle) แต่ยังเลือกไม่ครบ ให้แสดง Dialog บังคับเลือกที่นั่ง
    const earlyDirection = this.isInboundDirection() ? 'inbound' : 'outbound';
    const earlyEntitledCount = this.getEntitledPassengerIndexes(earlyDirection).length;
    const hasUnselectedServiceInDirection = earlyEntitledCount > 0 && this.getCurrentDirectionSegments().some(seg => {
      const selectedForEntitled = this.getEntitledSelectedCountForSegment(seg.key);
      return selectedForEntitled < earlyEntitledCount;
    });
    if (hasUnselectedServiceInDirection) {
      const targetSeg = this.findFirstIncompleteEntitlementSegmentInCurrentDirection();
      if (targetSeg && targetSeg !== this.currentSegmentKey) {
        this.switchSegment(targetSeg);
        return;
      }
      this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_select_seat' }
      });
      return;
    }


    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    // หา passenger ที่ไม่มี bundle และยังไม่ได้เลือกที่นั่งในทิศทางปัจจุบัน (เสนอขายที่นั่ง)
    const currentSegs = this.getCurrentDirectionSegments();
    const nonBundleIdxs = this.passengers
      .map((_, idx) => idx)
      .filter(idx => !this.isInfant(idx) && !this.passengerHasS150Bundle(idx, direction));
    const unseatedNonBundleIdxs = nonBundleIdxs.filter(idx => {
      // ต้องมีที่นั่งครบทุก segment ของทิศทางปัจจุบัน จึงถือว่าเลือกครบ
      const isFullySeatedInDirection = currentSegs.every(seg => {
        const seatMap = this.segmentSeatMap[seg.key] || {};
        return !!seatMap[idx];
      });
      return !isFullySeatedInDirection;
    });

    // แสดง upsell เฉพาะเมื่ออยู่ context สุดท้าย และไม่มีการเลือกใดๆ โดยผู้ไม่มี bundle มาก่อน
    const isFinalContext = this.isFinalContextForUpsell();
    const hasAnyNonBundleSelectionAnywhere = this.hasAnySeatSelectedByNonBundlePassengersAnywhere();

    if (isFinalContext && unseatedNonBundleIdxs.length > 0 && !this.acknowledgedUpsellByDirection[direction] && !hasAnyNonBundleSelectionAnywhere) {
      const message = unseatedNonBundleIdxs
        .map(i => `${this.passengers[i].firstName} ${this.passengers[i].lastName}`)
        .join(', ');
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { isDialog: 'alert_select_seat_not_include_package', message }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result && result.result === 'confirm') {
          this.acknowledgedUpsellByDirection[direction] = true;
          // สลับไปยัง segment แรกสุดของ direction แรกที่ยังไม่เลือกสำหรับผู้ไม่มี bundle
          const targetSeg = this.findFirstSegmentWithUnseatedNonBundleAcrossDirections();
          if (targetSeg && targetSeg !== this.currentSegmentKey) {
            this.switchSegment(targetSeg);
            return;
          }
        } else {
          // ไม่สนใจ: ไปหน้าถัดไป (context สุดท้ายแล้ว)
          if (this.isInboundDirection() || !this.hasInbound) {
            if (this.enforceAllServiceBundlesSelectedOrRedirect()) return;
            this.router.navigate(['/review']);
          } else {
            this.switchDirection('inbound');
          }
        }
      });
      return;
    }

    // ไม่มี dialog ใดๆ ให้สลับไป segment ถัดไปในทิศทางเดียวกันก่อน หากหมดแล้วค่อยไปทิศทางถัดไป
    const nextSeg = this.getNextSegmentInCurrentDirection();
    if (nextSeg) {
      this.switchSegment(nextSeg);
      return;
    }
    if (this.isInboundDirection() || !this.hasInbound) {
      if (this.enforceAllServiceBundlesSelectedOrRedirect()) return;
      this.router.navigate(['/review']);
    } else {
      this.switchDirection('inbound');
    }
  }

  // --- ตรวจทุกทิศทาง: ถ้ามี segment ที่มี service bundle แต่ยังเลือกไม่ครบ ให้เปิด Dialog และสลับไปยัง segment นั้น ---
  private enforceAllServiceBundlesSelectedOrRedirect(): boolean {
    const { hasUnselectedService, unselectedSegments } = this.checkRemainingServiceSegments();
    if (!hasUnselectedService) return false;

    const targetSeg = unselectedSegments[0];
    if (targetSeg && targetSeg !== this.currentSegmentKey) {
      this.switchSegment(targetSeg);
    }
    this.dialog.open(DialogComponent, {
      width: '350px',
      disableClose: true,
      data: { isDialog: 'alert_select_seat' }
    });
    return true;
  }

  // ฟังก์ชันคำนวณราคารวมจากทุก segment
  calculateTotalPrice(): number {
    let totalPrice = 0;
    
    this.segmentList.forEach(segment => {
      const direction = this.getDirectionFromSegmentKey(segment.key);
      const segmentSeats = this.segmentSelectedSeat[segment.key] || [];
      const seatMap = this.segmentSeatMap[segment.key] || {};
      // ทำ reverse map: label -> passengerIndex
      const labelToPassengerIndex: { [label: string]: number } = {};
      Object.keys(seatMap).forEach((pIdxStr: string) => {
        const label = seatMap[parseInt(pIdxStr, 10)];
        if (label) labelToPassengerIndex[label] = parseInt(pIdxStr, 10);
      });

      segmentSeats.forEach((seat: any) => {
        const passengerIndex = labelToPassengerIndex[seat.label];
        const hasS150Entitlement = typeof passengerIndex === 'number' && this.passengerHasS150Bundle(passengerIndex, direction);
        if (hasS150Entitlement && seat.serviceCode === 'S150') {
          totalPrice += 0;
        } else {
          totalPrice += seat.amountIncludingVat || 0;
        }
      });
    });

    this.passDataService.setTotalPrice(totalPrice);   
    
    return totalPrice;
  }

  

  // คืนค่า index ผู้โดยสารที่มีค่าใช้จ่ายที่นั่งในทิศทางนั้นๆ (ยกเว้นสิทธิ์ฟรี S150)
  private getPaidPassengerIndexesByDirection(direction: 'outbound' | 'inbound'): number[] {
    const paidPassengerIndexSet = new Set<number>();

    this.segmentList
      .filter(segment => this.getDirectionFromSegmentKey(segment.key) === direction)
      .forEach(segment => {
        const segmentSeats = (this.segmentSelectedSeat[segment.key] || []) as any[];
        const seatMap = this.segmentSeatMap[segment.key] || {};

        const labelToPassengerIndex: { [label: string]: number } = {};
        Object.keys(seatMap).forEach((pIdxStr: string) => {
          const label = seatMap[parseInt(pIdxStr, 10)];
          if (label) labelToPassengerIndex[label] = parseInt(pIdxStr, 10);
        });

        segmentSeats.forEach((seat: any) => {
          const passengerIndex = labelToPassengerIndex[seat.label];
          const hasS150Entitlement = typeof passengerIndex === 'number' && this.passengerHasS150Bundle(passengerIndex, direction);
          const isFreeByEntitlement = hasS150Entitlement && seat.serviceCode === 'S150';
          if (!isFreeByEntitlement && typeof passengerIndex === 'number') {
            paidPassengerIndexSet.add(passengerIndex);
          }
        });
      });

    return Array.from(paidPassengerIndexSet.values());
  }

  private getPassengerFullName(index: number): string {
    const p = this.passengers[index] as any;
    if (!p) return `ผู้โดยสาร #${index + 1}`;
    const first = (p.firstName || '').toString().trim();
    const last = (p.lastName || '').toString().trim();
    return `${first} ${last}`.trim();
  }

  private buildChargeMessage(outboundNames: string[], inboundNames: string[]): string {
    const parts: string[] = [];
    if (outboundNames.length > 0) {
      parts.push(`ขาไป: ${outboundNames.join(', ')}`);
    }
    if (inboundNames.length > 0) {
      parts.push(`ขากลับ: ${inboundNames.join(', ')}`);
    }
    return parts.join('\n');
  }

  // ตรวจผู้โดยสารที่มีสิทธิ์ที่นั่งฟรี (S150) แต่เลือกที่นั่งที่ไม่รวมในแพ็กเกจในทิศทางที่ระบุ
  private getEntitledNonIncludedPassengerIndexesByDirection(direction: 'outbound' | 'inbound'): number[] {
    const affectedPassengerIndexSet = new Set<number>();
    this.segmentList
      .filter(segment => this.getDirectionFromSegmentKey(segment.key) === direction)
      .forEach(segment => {
        const segmentSeats = (this.segmentSelectedSeat[segment.key] || []) as any[];
        const seatMap = this.segmentSeatMap[segment.key] || {};
        const labelToPassengerIndex: { [label: string]: number } = {};
        Object.keys(seatMap).forEach((pIdxStr: string) => {
          const label = seatMap[parseInt(pIdxStr, 10)];
          if (label) labelToPassengerIndex[label] = parseInt(pIdxStr, 10);
        });
        segmentSeats.forEach((seat: any) => {
          const passengerIndex = labelToPassengerIndex[seat.label];
          const entitled = typeof passengerIndex === 'number' && this.passengerHasS150Bundle(passengerIndex, direction);
          const notIncluded = seat && seat.serviceCode !== 'S150';
          if (entitled && notIncluded && typeof passengerIndex === 'number') {
            affectedPassengerIndexSet.add(passengerIndex);
          }
        });
      });
    return Array.from(affectedPassengerIndexSet.values());
  }

  // ฟังก์ชันคำนวณราคาสำหรับ segment ปัจจุบัน
  calculateCurrentSegmentPrice(): number {
    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    // ทำ reverse map: label -> passengerIndex สำหรับ segment ปัจจุบัน
    const labelToPassengerIndex: { [label: string]: number } = {};
    Object.keys(this.passengerSeatMap).forEach((pIdxStr: string) => {
      const label = this.passengerSeatMap[parseInt(pIdxStr, 10)];
      if (label) labelToPassengerIndex[label] = parseInt(pIdxStr, 10);
    });

    return this.selectedSeat.reduce((sum, s) => {
      const passengerIndex = labelToPassengerIndex[s.label];
      const hasS150Entitlement = typeof passengerIndex === 'number' && this.passengerHasS150Bundle(passengerIndex, direction);
      if (hasS150Entitlement && s.serviceCode === 'S150') {
        return sum;
      }
      return sum + (s.amountIncludingVat || 0);
    }, 0);
  }

  // ปรับปรุงฟังก์ชัน getTotalPrice
  getTotalPrice(): number {
    return this.calculateTotalPrice();
  }

  // --- ฟังก์ชันสำหรับ UI ใหม่ ---
  // --- Helpers สำหรับกำหนดสิทธิ์เลือกที่นั่ง (ตัด Infant ออก) ---
  private getPassengerAgeYearsFromBirthDate(birthDate: any): number | null {
    if (!birthDate) return null;
    const bd = new Date(birthDate);
    if (isNaN(bd.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }

  isInfant(index: number): boolean {
    const p: any = this.passengers[index];
    if (!p) return false;
    const age = this.getPassengerAgeYearsFromBirthDate(p.birthDate);
    if (age === null) return false;
    return age < 2;
  }

  private getSeatEligiblePassengerIndexes(): number[] {
    return this.passengers
      .map((_, idx) => idx)
      .filter(idx => !this.isInfant(idx));
  }

  private getSeatEligibleCount(): number {
    return this.getSeatEligiblePassengerIndexes().length;
  }
  
  // ตรวจสอบว่าเป็น inbound direction (ขากลับ) หรือไม่
  isInboundDirection(): boolean {
    return this.currentSegmentKey.startsWith('inbound');
  }

  // เปลี่ยน direction (ขาไป/ขากลับ)
  switchDirection(direction: 'inbound' | 'outbound') {
    this.saveCurrentSegmentData();
    
    // หา segment แรกของ direction ที่เลือก
    const targetSegment = this.segmentList.find(seg => seg.key.startsWith(direction));
    if (targetSegment) {
      this.currentSegmentKey = targetSegment.key;
      this.loadSegmentData();
      this.scrollSelectingPassengerIntoView();
    }
  }

  

  // ได้ segments ของ direction ปัจจุบัน
  getCurrentDirectionSegments() {
    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    return this.segmentList.filter(seg => seg.key.startsWith(direction));
  }

  // คืนค่า segments ของทิศทางที่ระบุ โดยเรียงลำดับตามเลขต่อท้ายคีย์
  private getSortedDirectionSegments(direction: 'outbound' | 'inbound') {
    return this.segmentList
      .filter(seg => seg.key.startsWith(direction))
      .sort((a, b) => {
        const ai = parseInt(a.key.replace(/\D/g, ''), 10) || 0;
        const bi = parseInt(b.key.replace(/\D/g, ''), 10) || 0;
        return ai - bi;
      });
  }

  // หา segment ถัดไปในทิศทางปัจจุบัน ถ้ามีให้คืนค่า key ไม่เช่นนั้นคืนค่า null
  private getNextSegmentInCurrentDirection(): string | null {
    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    const segs = this.getSortedDirectionSegments(direction);
    const idx = segs.findIndex(s => s.key === this.currentSegmentKey);
    if (idx >= 0 && idx < segs.length - 1) {
      return segs[idx + 1].key;
    }
    return null;
  }

  // หา segment แรกในทิศทางปัจจุบันที่ผู้โดยสารที่มีสิทธิ์ S150 ยังเลือกไม่ครบ
  private findFirstIncompleteEntitlementSegmentInCurrentDirection(): string | null {
    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    const entitledCount = this.getEntitledPassengerIndexes(direction).length;
    if (entitledCount === 0) return null;
    const segs = this.getSortedDirectionSegments(direction);
    for (const seg of segs) {
      const selectedForEntitled = this.getEntitledSelectedCountForSegment(seg.key);
      if (selectedForEntitled < entitledCount) return seg.key;
    }
    return null;
  }

  // ตรวจว่าเป็น direction สุดท้ายหรือไม่ (one-way: outbound, round-trip: inbound)
  private isLastDirection(): boolean {
    // ถ้ามี inbound แปลว่าเที่ยวบินไป-กลับ ทิศทางสุดท้ายคือ inbound
    if (this.hasInbound) return this.isInboundDirection();
    // ถ้าไม่มี inbound แปลว่า one-way ทิศทางสุดท้ายคือ outbound
    return !this.isInboundDirection();
  }

  // ตรวจว่าอยู่ segment ท้ายสุดของทิศทางปัจจุบันหรือไม่
  private isLastSegmentInCurrentDirection(): boolean {
    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    const segs = this.getSortedDirectionSegments(direction);
    const idx = segs.findIndex(s => s.key === this.currentSegmentKey);
    return idx === segs.length - 1;
  }

  // เงื่อนไข context สุดท้ายสำหรับการแสดง Upsell dialog
  private isFinalContextForUpsell(): boolean {
    return this.isLastDirection() && this.isLastSegmentInCurrentDirection();
  }

  // ตรวจว่ามีการเลือกที่นั่งโดยผู้โดยสารที่ไม่มี bundle (ตามทิศทางปัจจุบัน) ใน segment ใดๆ หรือไม่
  private hasAnySeatSelectedByNonBundlePassengersAnywhere(): boolean {
    for (const segment of this.segmentList) {
      const direction = this.getDirectionFromSegmentKey(segment.key);
      const nonBundleIdxs = this.passengers
        .map((_, idx) => idx)
        .filter(idx => !this.passengerHasS150Bundle(idx, direction));
      if (nonBundleIdxs.length === 0) continue;
      const nonBundleSet = new Set(nonBundleIdxs);
      const seatMap = this.segmentSeatMap[segment.key] || {};
      for (const pIdxStr of Object.keys(seatMap)) {
        const pIdx = parseInt(pIdxStr, 10);
        if (nonBundleSet.has(pIdx) && !!seatMap[pIdx]) {
          return true;
        }
      }
    }
    return false;
  }

  

  getOriginAirportName(segmentKey: string): string {
    try {
      const flightData = this.passDataService.getFlightData();
      if (!flightData) return '';

      const direction = segmentKey.startsWith('inbound') ? 'inbound' : 'outbound';
      const segmentIndex = parseInt(segmentKey.replace(/\D/g, '')) - 1;

      if (direction === 'inbound' && flightData.inbound_flight_select?.flight_detail) {
        const flightDetail = flightData.inbound_flight_select.flight_detail[segmentIndex];
        return flightDetail?.originAirportName || '';
      } else if (direction === 'outbound' && flightData.outbound_flight_select?.flight_detail) {
        const flightDetail = flightData.outbound_flight_select.flight_detail[segmentIndex];
        return flightDetail?.originAirportName || '';
      }

      return '';
    } catch (error) {
      console.error('Error getting origin airport name:', error);
      return '';
    }
  }

  getDestinationAirportName(segmentKey: string): string {
    try {
      const flightData = this.passDataService.getFlightData();
      if (!flightData) return '';

      const direction = segmentKey.startsWith('inbound') ? 'inbound' : 'outbound';
      const segmentIndex = parseInt(segmentKey.replace(/\D/g, '')) - 1;

      if (direction === 'inbound' && flightData.inbound_flight_select?.flight_detail) {
        const flightDetail = flightData.inbound_flight_select.flight_detail[segmentIndex];
        return flightDetail?.destinationAirportName || '';
      } else if (direction === 'outbound' && flightData.outbound_flight_select?.flight_detail) {
        const flightDetail = flightData.outbound_flight_select.flight_detail[segmentIndex];
        return flightDetail?.destinationAirportName || '';
      }

      return '';
    } catch (error) {
      console.error('Error getting destination airport name:', error);
      return '';
    }
  }

  // อัปเดตข้อมูล pricing จาก API seatmap แยกตาม Outbound/Inbound
  updatePricingFromAPI(seatMapPromise: Promise<any>, direction: 'outbound' | 'inbound') {
    try {
      seatMapPromise.then((seatMapData: any) => {
        // รวม seatMaps จากทั้งรูปแบบ API เก่า (cabinInfos)
        // และรูปแบบใหม่ (data[] -> cabinInfos/canbins)
        const aggregateSeatMaps: any[] = [];

        if (seatMapData?.cabinInfos?.length > 0) {
          const cabinInfo = seatMapData.cabinInfos[0];
          if (Array.isArray(cabinInfo.seatMaps)) {
            aggregateSeatMaps.push(...cabinInfo.seatMaps);
          }
        } else if (Array.isArray(seatMapData?.data) && seatMapData.data.length > 0) {
          seatMapData.data.forEach((flightObj: any) => {
            const cabinLike = (flightObj?.cabinInfos && flightObj.cabinInfos[0])
              || (flightObj?.canbins && flightObj.canbins[0])
              || null;
            if (cabinLike?.seatMaps && Array.isArray(cabinLike.seatMaps)) {
              aggregateSeatMaps.push(...cabinLike.seatMaps);
            }
          });
        }

        // ถ้าไม่พบ seatMaps ก็จบการทำงาน
        if (aggregateSeatMaps.length === 0) return;

        // ตรวจสอบ service bundle ตาม direction (ใช้เพื่อ debug/log)
        const flightData = this.passDataService.getFlightData();
        let hasService = false;
        if (direction === 'outbound' && flightData?.outbound_flight_select?.service_bundle) {
          hasService = flightData.outbound_flight_select.service_bundle.serviceName !== '';
        } else if (direction === 'inbound' && flightData?.inbound_flight_select?.service_bundle) {
          hasService = flightData.inbound_flight_select.service_bundle.serviceName !== '';
        }

        // วนลูปผ่านทุก seat เพื่อหา Max ราคาแต่ละประเภทบริการ
        aggregateSeatMaps.forEach((row: any) => {
          const seats = Array.isArray(row?.seats) ? row.seats : [];
          seats.forEach((seat: any) => {
            if (seat?.available) {
              switch (seat.serviceCode) {
                case 'S500':
                  if (seat.amountIncludingVat > this.premiumPlusPrice) {
                    this.premiumPlusPrice = seat.amountIncludingVat;
                  }
                  break;
                case 'S300':
                  if (seat.amountIncludingVat > this.premiumPrice) {
                    this.premiumPrice = seat.amountIncludingVat;
                  }
                  break;
                case 'S150':
                  if (seat.amountIncludingVat > this.regularPrice) {
                    this.regularPrice = seat.amountIncludingVat;
                  }
                  break;
              }
            }
          });
        });

      }).catch((error) => {
        console.error(`Error in updatePricingFromAPI promise for ${direction}:`, error);
      });
    } catch (error) {
      console.error(`Error updating pricing from API for ${direction}:`, error);
    }
  }

  // ฟังก์ชันสำหรับเช็คว่า segment ปัจจุบันมี free seat หรือไม่
  getCurrentSegmentFreeSeat(): boolean {
    if (this.isInboundDirection()) {
      return this.freeSeatInbound;
    } else {
      return this.freeSeatOutbound;
    }
  }

  // ฟังก์ชันเช็คว่ามี segment ที่มี service bundle และยังไม่ได้เลือกที่นั่งครบ
  checkRemainingServiceSegments(): { hasUnselectedService: boolean, unselectedSegments: string[] } {
    const unselectedSegments: string[] = [];
    let hasUnselectedService = false;

    this.segmentList.forEach(segment => {
      // // ถ้าไม่มี service bundle ไม่ต้องเช็คการเลือกที่นั่ง
      const direction = this.getDirectionFromSegmentKey(segment.key);
      // ใช้สิทธิ์จากระดับผู้โดยสารเป็นเกณฑ์หลัก (ไม่พึ่งพา flight-level service_bundle)
      const entitledIndexes = new Set(this.getEntitledPassengerIndexes(direction));
      if (entitledIndexes.size === 0) return; // ไม่มีผู้มีสิทธิ์ ไม่ต้องบังคับ

      const segmentSeatMap = this.segmentSeatMap[segment.key] || {};
      let selectedForEntitled = 0;
      Object.keys(segmentSeatMap).forEach((pIdxStr: string) => {
        const pIdx = parseInt(pIdxStr, 10);
        if (entitledIndexes.has(pIdx) && segmentSeatMap[pIdx]) selectedForEntitled++;
      });

      if (selectedForEntitled < entitledIndexes.size) {
        hasUnselectedService = true;
        unselectedSegments.push(segment.key);
      }
    });

    return { hasUnselectedService, unselectedSegments };
  }

  

  // เพิ่มฟังก์ชัน loadSeatMapData หลังจาก getTotalPrice()
  loadSeatMapData() {
    try {
      const flightData = this.passDataService.getFlightData();
      if (!flightData) {
        console.warn('No flight data available for loadSeatMapData');
        return;
      }

      let loadedCount = 0;
      let totalToLoad = 0;

      // โหลดข้อมูล seatmap สำหรับ outbound: เรียกครั้งเดียวต่อทิศทาง
      if (flightData.outbound_flight_select?.flight_detail) {
        const outboundFlights = flightData.outbound_flight_select.flight_detail;
        const journeyKey = flightData.outbound_flight_select.journey_key;
        const fareKey = flightData.outbound_flight_select.fare_key;
        if (journeyKey && fareKey) {
          totalToLoad += 1;
          const promise = this.apiService.getSeatMap(journeyKey, fareKey).toPromise();
          this.updatePricingFromAPI(promise, 'outbound');
          promise.then((data: any) => {
            this.processSeatMapResponseForDirection(data, 'outbound', outboundFlights.length);
            loadedCount++;
            this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
          }).catch((error) => {
            console.error('Error loading outbound seatmap:', error);
            loadedCount++;
            this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
          });
        }
      }

      // โหลดข้อมูล seatmap สำหรับ inbound: เรียกครั้งเดียวต่อทิศทาง
      if (flightData.inbound_flight_select?.flight_detail) {
        const inboundFlights = flightData.inbound_flight_select.flight_detail;
        const journeyKey = flightData.inbound_flight_select.journey_key;
        const fareKey = flightData.inbound_flight_select.fare_key;
        if (journeyKey && fareKey) {
          totalToLoad += 1;
          const promise = this.apiService.getSeatMap(journeyKey, fareKey).toPromise();
          this.updatePricingFromAPI(promise, 'inbound');
          promise.then((data: any) => {
            this.processSeatMapResponseForDirection(data, 'inbound', inboundFlights.length);
            loadedCount++;
            this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
          }).catch((error) => {
            console.error('Error loading inbound seatmap:', error);
            loadedCount++;
            this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
          });
        }
      }

    } catch (error) {
      console.error('Error in loadSeatMapData:', error);
    }
  }

  // แปลง response seat map ที่อาจรวมหลายเครื่องในครั้งเดียว และกระจายลงตาม segment
  private processSeatMapResponseForDirection(data: any, direction: 'outbound' | 'inbound', segmentCount: number) {
    try {
      // กรณี API เดิม: cabinInfos เดียว
      if (data && data.cabinInfos && Array.isArray(data.cabinInfos)) {
        const transformed = this.transformCabinInfoToSeatMap(data as CabinInfoResponse);
        if (direction === 'outbound') {
          this.outboundSeatMap = transformed;
          // กระจายให้ครบทุก segment ถ้าไม่มีข้อมูลราย segment
          this.outboundSeatMaps = Array.from({ length: Math.max(1, segmentCount) }, () => transformed);
        } else {
          this.inboundSeatMap = transformed;
          this.inboundSeatMaps = Array.from({ length: Math.max(1, segmentCount) }, () => transformed);
        }
        return;
      }

      // กรณีใหม่: data.data เป็น array ของเครื่อง/segment
      const flightsArray = (data && Array.isArray(data.data)) ? data.data : [];
      if (flightsArray.length > 0) {
        const mapsPerSegment: any[][][] = [];
        flightsArray.forEach((flightObj: any, idx: number) => {
          const cabinLike = (flightObj && flightObj.cabinInfos && flightObj.cabinInfos[0])
            || (flightObj && flightObj.canbins && flightObj.canbins[0])
            || null;
          const seatMaps = cabinLike && Array.isArray(cabinLike.seatMaps) ? cabinLike.seatMaps : [];
          // สร้าง wrapper ให้ใช้ทรานส์ฟอร์มเดิมได้
          const seatCount = seatMaps.reduce((sum: number, r: any) => sum + ((r && Array.isArray(r.seats)) ? r.seats.length : 0), 0);
          const wrapper: CabinInfoResponse = { cabinInfos: [{ cabinName: cabinLike?.cabinName || 'ECONOMY', seatCount, seatMaps }] as any } as CabinInfoResponse;
          const transformed = this.transformCabinInfoToSeatMap(wrapper);
          mapsPerSegment[idx] = transformed;
        });

        if (direction === 'outbound') {
          this.outboundSeatMaps = mapsPerSegment;
          this.outboundSeatMap = mapsPerSegment[0] || [];
        } else {
          this.inboundSeatMaps = mapsPerSegment;
          this.inboundSeatMap = mapsPerSegment[0] || [];
        }
        return;
      }

      console.warn('processSeatMapResponseForDirection - ไม่พบรูปแบบข้อมูลที่รองรับ', { direction, segmentCount });
    } catch (e) {
      console.error('processSeatMapResponseForDirection - error:', e);
    }
  }

  // เพิ่มฟังก์ชัน checkAllSeatMapsLoaded
  checkAllSeatMapsLoaded(loadedCount: number, totalToLoad: number) {
    
    if (loadedCount >= totalToLoad) {
      
      // อัปเดต seatmap ตาม segment ปัจจุบัน
      this.updateSeatMapForCurrentSegment();
      
      // โหลดข้อมูลที่นั่งที่บันทึกไว้
      this.subscribeToSeatData();
      this.isLoading = false;
    }
  }

  // เลื่อนให้ผู้โดยสารที่กำลังถูกเลือกให้อยู่กลาง viewport ของแถบแนวนอน
  private scrollSelectingPassengerIntoView() {
    setTimeout(() => {
      const next = (this.selectedPassengerIndex !== null && this.selectedPassengerIndex >= 0)
        ? this.selectedPassengerIndex
        : this.getNextUnassignedPassengerIndex();
      if (next < 0) return;
      const container = this.passengerScrollContainer?.nativeElement;
      const boxes = this.passengerBoxes?.toArray().map(r => r.nativeElement) ?? [];
      if (!container || !boxes[next]) return;
      const targetEl = boxes[next];
      try {
        targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch {
        const offsetLeft = targetEl.offsetLeft - (container.clientWidth / 2) + (targetEl.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, offsetLeft), behavior: 'smooth' });
      }
    }, 0);
  }

  // --- ฟังก์ชันใหม่: ตรวจเฉพาะผู้โดยสารที่มีสิทธิ์ (bundle S150) ตามทิศทาง ---
  private getEntitledPassengerIndexes(direction: 'outbound' | 'inbound'): number[] {
    const entitled: number[] = [];
    this.passengers.forEach((_, index) => {
      if (this.passengerHasS150Bundle(index, direction)) entitled.push(index);
    });
    return entitled;
  }

  private getEntitledSelectedCountForSegment(segmentKey: string): number {
    const direction = this.getDirectionFromSegmentKey(segmentKey);
    const entitled = new Set(this.getEntitledPassengerIndexes(direction));
    const segmentSeatMap = this.segmentSeatMap[segmentKey] || {};
    let count = 0;
    Object.keys(segmentSeatMap).forEach((pIdxStr: string) => {
      const pIdx = parseInt(pIdxStr, 10);
      if (entitled.has(pIdx) && segmentSeatMap[pIdx]) count++;
    });
    return count;
  }

  // ตรวจสอบว่ามีการเลือกที่นั่งใน segment ใดๆ หรือไม่
  hasSelectedSeatsInAnySegment(): boolean {
    return this.segmentList.some(segment => {
      const segmentSeats = this.segmentSelectedSeat[segment.key] || [];
      return segmentSeats.length > 0;
    });
  }

  // ระบุผู้โดยสารที่กำลังถูกเลือกที่นั่งใน segment ปัจจุบัน
  isSelectingPassenger(passengerIndex: number): boolean {
    // หากผู้ใช้เลือกผู้โดยสารด้วยตนเอง ให้ไฮไลต์คนที่เลือก
    if (this.selectedPassengerIndex !== null) {
      return this.selectedPassengerIndex === passengerIndex;
    }
    // มิฉะนั้น ใช้โหมดอัตโนมัติ: คนถัดไปที่ยังไม่มีที่นั่ง
    const next = this.getNextUnassignedPassengerIndex();
    return next === passengerIndex;
  }

  

  hasServiceBundle(passengerIndex: number): boolean {
    const passenger: any = this.passengers[passengerIndex];
    if (!passenger) return false;
    if (this.isInboundDirection()) {
      return !!passenger.returnBundle;
    } else {
      return !!passenger.outboundBundle;
    }
  }

  // --- ฟังก์ชันใหม่: เมื่อคลิกผู้โดยสารให้ตั้งค่าผู้โดยสารเป้าหมาย ---
  onPassengerClick(index: number) {
    if (index < 0 || index >= this.passengers.length) return;
    // ไม่อนุญาตเลือกผู้โดยสารที่เป็น Infant
    if (this.isInfant(index)) return;
    // ถ้าคลิกซ้ำที่ผู้โดยสารคนเดิม ให้ยกเลิกและกลับไปโหมดอัตโนมัติ
    if (this.selectedPassengerIndex === index) {
      this.selectedPassengerIndex = null;
    } else {
      this.selectedPassengerIndex = index;
    }
    this.scrollSelectingPassengerIntoView();
  }

  // --- ฟังก์ชันใหม่: คืนค่า index ผู้โดยสารที่ควรถูกกำหนดที่นั่ง ---
  private getTargetPassengerIndexForSelection(): number {
    if (this.selectedPassengerIndex !== null && this.selectedPassengerIndex >= 0 && this.selectedPassengerIndex < this.passengers.length) {
      // หากผู้ที่ถูกเลือกเป็น Infant ให้ข้ามไปหา index ถัดไปที่ยังไม่ได้กำหนดและไม่ใช่ Infant
      if (!this.isInfant(this.selectedPassengerIndex)) return this.selectedPassengerIndex;
    }
    return this.getNextUnassignedPassengerIndex();
  }

  // หา segment แรกของ direction แรก (outbound ก่อน inbound) ที่ยังไม่เลือกที่นั่งสำหรับผู้ไม่มี bundle
  private findFirstSegmentWithUnseatedNonBundleAcrossDirections(): string | null {
    const directions: ('outbound' | 'inbound')[] = ['outbound', 'inbound'];
    for (const dir of directions) {
      const nonBundleIdxs = this.passengers
        .map((_, idx) => idx)
        .filter(idx => !this.passengerHasS150Bundle(idx, dir));
      if (nonBundleIdxs.length === 0) continue;
      const segs = this.getSortedDirectionSegments(dir);
      for (const seg of segs) {
        const seatMap = this.segmentSeatMap[seg.key] || {};
        const missing = nonBundleIdxs.some(idx => !seatMap[idx]);
        if (missing) return seg.key;
      }
    }
    return null;
  }
}
