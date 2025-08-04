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
  @Input() selectedPassenger: number = 2;
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
  isLoading: boolean = false;
  isShowDetailSeatPrice: boolean = false;
  freeSeatOutbound: boolean = false;
  freeSeatInbound: boolean = false;
  clickConfirmAddSeat:boolean = false;

  journeyKeyOutbound: string = '';
  farKeyOutbound: string = '';
  journeyKeyInbound: string = '';
  farKeyInbound: string = '';
  
  // ตัวแปรเก็บข้อมูล seatmap แยกตาม outbound และ inbound
  outboundSeatMap: any[][] = [];
  inboundSeatMap: any[][] = [];

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

    this.passDataService.getPassengerInfo().subscribe((data: any) => {
      console.log("getPassengerInfo flight-seat", data);
      if (data.flight_search.trip_type === "one-way") { 
        console.log("one-way");
        this.tripType = "one-way";
        this.journeyKeyOutbound = data.outbound_flight_select.journey_key;
        this.farKeyOutbound = data.outbound_flight_select.fare_key;
        
        // เช็ค service bundle สำหรับ outbound
        if (data.outbound_flight_select.service_bundle?.serviceName !== '') {
          this.freeSeatOutbound = true;
          console.log('Outbound has service bundle:', data.outbound_flight_select.service_bundle.serviceName);
        } else {
          this.freeSeatOutbound = false;
          console.log('Outbound has no service bundle');
        }
      } else if (data.flight_search.trip_type === "round-trip") {
        console.log("round-trip");
        this.tripType = "round-trip";
        this.journeyKeyOutbound = data.outbound_flight_select.journey_key;
        this.farKeyOutbound = data.outbound_flight_select.fare_key;
        this.journeyKeyInbound = data.inbound_flight_select.journey_key;
        this.farKeyInbound = data.inbound_flight_select.fare_key;
        
        // เช็ค service bundle สำหรับ outbound
        if (data.outbound_flight_select.service_bundle?.serviceName !== '') {
          this.freeSeatOutbound = true;
          console.log('Outbound has service bundle:', data.outbound_flight_select.service_bundle.serviceName);
        } else {
          this.freeSeatOutbound = false;
          console.log('Outbound has no service bundle');
        }
        
        // เช็ค service bundle สำหรับ inbound
        if (data.inbound_flight_select.service_bundle?.serviceName !== '') {
          this.freeSeatInbound = true;
          console.log('Inbound has service bundle:', data.inbound_flight_select.service_bundle.serviceName);
        } else {
          this.freeSeatInbound = false;
          console.log('Inbound has no service bundle');
        }
      }
      // console.log("journeyKeyOutbound flight-seat", this.journeyKeyOutbound);
      // console.log("farKeyOutbound flight-seat", this.farKeyOutbound);
      // console.log("journeyKeyInbound flight-seat", this.journeyKeyInbound);
      // console.log("farKeyInbound flight-seat", this.farKeyInbound);

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
        // if (data.outbound_flight_select.service_bundle.serviceName !== '') {
        //   this.freeSeatOutbound = true;
        // } else {
        //   this.freeSeatOutbound = false;
        // }
      } else if (data.flight_search.trip_type === "round-trip") {
        if (data.outbound_flight_select.flight_detail.length > 1) {
          this.connectFlightCountOutbound = 2;
          this.isConnectFlight = true;
          // if (data.inbound_flight_select.service_bundle.serviceName !== '') {
          //   this.freeSeatInbound = true;
          // } else {
          //   this.freeSeatInbound = false;
          // }
        }else{
          this.connectFlightCountOutbound = 1;
          this.isConnectFlight = false;
        }

        // if (data.inbound_flight_select.flight_detail.length > 1) {
        //   this.connectFlightCountInbound = 2;
        //   this.isConnectFlight = true;
        // }else{
        //   this.connectFlightCountInbound = 1;
        // }
      }
      // --- ตรวจสอบประเภทเที่ยวบินและเตรียม segment ---
      this.setupSegments();
      this.currentSegmentKey = this.segmentList[0]?.key || '';
      
      // อัปเดตข้อมูล pricing จาก API
      // this.updatePricingFromAPI(data);
      
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

  // switchLanguage(lang: 'th' | 'en') {
  //   this.translate.use(lang);
  // }



  // อัปเดตสถานะที่นั่งใน seatMap
  private updateSeatMapStatus() {
    console.log('updateSeatMapStatus - เริ่มต้น');
    console.log('updateSeatMapStatus - selectedSeat:', this.selectedSeat);
    
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
      console.log('updateSeatMapStatus - กำลังอัปเดตที่นั่ง:', selectedSeat.label);
      this.seatMap.forEach(row => {
        row.forEach(seat => {
          if (seat && seat.label === selectedSeat.label) {
            seat.status = 'selected';
            console.log('updateSeatMapStatus - อัปเดตที่นั่งสำเร็จ:', seat.label);
          }
        });
      });
    });
    
    console.log('updateSeatMapStatus - เสร็จสิ้น');
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



  onNextStep() {
    // เช็คว่ามี segment ที่เลือกที่นั่งแล้วแต่เลือกไม่ครบทุกคน
    const { hasIncompleteSelection, incompleteSegments } = this.checkIncompleteSeatSelection();
    
    if (hasIncompleteSelection) {
      // แสดง dialog alert_select_seat_not_enough
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { 
          isDialog: 'alert_select_seat_not_enough'
        }
      });
      
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          // ไปยัง segment แรกที่เลือกไม่ครบ
          const firstIncompleteSegment = incompleteSegments[0];
          if (firstIncompleteSegment && firstIncompleteSegment !== this.currentSegmentKey) {
            console.log(`onNextStep - ไปยัง segment ที่เลือกไม่ครบ: ${firstIncompleteSegment}`);
            this.switchSegment(firstIncompleteSegment);
          }
        }
      });
      return;
    }

    // เช็ค segment ที่มี service bundle และยังไม่ได้เลือกที่นั่ง
    const { hasUnselectedService, unselectedSegments } = this.checkRemainingServiceSegments();
    
    if (hasUnselectedService) {
      // ถ้ามี segment ที่มี service bundle แต่ยังไม่ได้เลือกที่นั่ง
      const nextSegment = this.findNextIncompleteServiceSegment();
      
      if (nextSegment && nextSegment !== this.currentSegmentKey) {
        // ไปยัง segment ที่ยังไม่เสร็จ
        console.log(`onNextStep - ไปยัง segment ที่ยังไม่เสร็จ: ${nextSegment}`);
        this.switchSegment(nextSegment);
        return;
      } else {
        // แสดง dialog เตือนให้เลือกที่นั่ง
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '350px',
          disableClose: true,
          data: { 
            isDialog: 'alert_select_seat',
            message: `กรุณาเลือกที่นั่งฟรีสำหรับ: ${unselectedSegments.join(', ')}`
          }
        });
        
        dialogRef.afterClosed().subscribe((result: any) => {
          if (result.result === 'confirm') {
            // ไม่ไปหน้าต่อไป ต้องเลือกที่นั่งก่อน
            return;
          }
        });
      }
    } else {
      // ถ้าไม่มี service bundle ที่ต้องเลือก หรือเลือกครบแล้ว
      // ตรวจสอบว่ามี segment ที่ไม่มี service bundle หรือไม่
      const { hasNonServiceSegments, nonServiceSegments, outboundHasNoService, inboundHasNoService } = this.checkNonServiceSegments();
      
      if (hasNonServiceSegments) {
        // สร้างข้อความแจ้งเตือน
        const warningMessage = this.getServiceBundleWarningMessage(outboundHasNoService, inboundHasNoService);
        
        // แสดง dialog alert_select_seat_not_include_package
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '350px',
          disableClose: true,
          data: { 
            isDialog: 'alert_select_seat_not_include_package',
            message: warningMessage,
            outboundHasNoService: outboundHasNoService,
            inboundHasNoService: inboundHasNoService
          }
        });
        
        dialogRef.afterClosed().subscribe((result: any) => {
          if (result.result === 'confirm') {
            // หา segment ที่ยังไม่เลือกที่นั่งครบ
            const incompleteSegment = this.findIncompleteSegment();
            if (incompleteSegment && incompleteSegment !== this.currentSegmentKey) {
              console.log(`onNextStep - ไปยัง segment ที่ยังไม่เลือกครบ: ${incompleteSegment}`);
              this.switchSegment(incompleteSegment);
            }
          } else {
            // ถ้าไม่สนใจ ไปหน้าต่อไป
            this.router.navigate(['/review']);
          }
        });
      } else {
        // ถ้าไม่มี segment ที่ไม่มี service bundle ไปหน้าต่อไป
        this.router.navigate(['/review']);
      }
    }
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
        this.clearAllSeats();
        // ลบข้อมูลที่นั่งของ segment ปัจจุบันเท่านั้น
        // Object.values(this.passengerSeatMap).forEach(seatID => {
        //   if (seatID) {
        //     // find seat in seatMap that match seatID
        //     for (const row of this.seatMap) {
        //       for (const seat of row) {
        //         if (seat && seat.label === seatID) {
        //           seat.status = 'available';
        //         }
        //       }
        //     }
        //   }
        // });
        
        // // ลบข้อมูลของ segment ปัจจุบัน
        // this.passengerSeatMap = {};
        // this.selectedSeat = [];
        // this.selectedSeatPrice = 0;
        // this.SelectedSeat = [];
        // this.saveCurrentSegmentData();
      }
    });
  }
  
  clearAllSeats() {
    // ล้างข้อมูลในทุก segment
    this.segmentList.forEach(segment => {
      // ล้างข้อมูลใน segmentSeatMap
      this.segmentSeatMap[segment.key] = {};
      this.segmentSelectedSeat[segment.key] = [];
      this.segmentSelectedSeatPrice[segment.key] = 0;
    });
    
    // ล้างข้อมูลใน segment ปัจจุบัน
    this.passengerSeatMap = {};
    this.selectedSeat = [];
    this.selectedSeatPrice = 0;
    this.SelectedSeat = [];
    
    // อัปเดตสถานะที่นั่งใน seatMap
    this.updateSeatMapStatus();
    
    console.log('clearAllSeats - ล้างที่นั่งที่เลือกในทุก segment แล้ว');
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

  // อัปเดตฟังก์ชัน hasSeat เพื่อตรวจสอบว่าผู้โดยสารมีที่นั่งในทุกเที่ยวบินแล้ว
  hasSeat(passengerIndex: number): boolean {
    // เช็คว่า segment ปัจจุบันมี service bundle หรือไม่
    const currentSegmentHasService = this.getCurrentSegmentFreeSeat();
    
    // ถ้า segment ปัจจุบันไม่มี service bundle ไม่ต้องแสดงไอคอน
    if (!currentSegmentHasService) {
      return false;
    }
    
    // เช็คว่าผู้โดยสารเลือกที่นั่งใน segment ปัจจุบันหรือไม่
    const passengerSeat = this.passengerSeatMap[passengerIndex];
    return !!passengerSeat;
  }

  // ฟังก์ชันเช็คว่าผู้โดยสารเลือกที่นั่งครบใน connect flight หรือไม่
  hasSeatInServiceSegments(passengerIndex: number): boolean {
    // เช็คว่าผู้โดยสารเลือกที่นั่งครบใน segment ปัจจุบันหรือไม่
    const segmentSeatMap = this.segmentSeatMap[this.currentSegmentKey] || {};
    const passengerSeat = segmentSeatMap[passengerIndex];
    
    return !!passengerSeat;
  }

  // เพิ่มฟังก์ชันใหม่สำหรับเช็คการเลือกที่นั่งในทุก segment ที่มี service bundle
  hasSeatInAllServiceSegments(passengerIndex: number): boolean {
    let hasSeatInAllServiceSegments = true;
    
    this.segmentList.forEach(segment => {
      // เช็คว่า segment นี้มี service bundle หรือไม่
      const segmentHasService = segment.key.startsWith('inbound') ? this.freeSeatInbound : this.freeSeatOutbound;
      
      // ถ้ามี service bundle ให้เช็คว่าเลือกที่นั่งแล้วหรือยัง
      if (segmentHasService) {
        const segmentSeatMap = this.segmentSeatMap[segment.key] || {};
        const passengerSeat = segmentSeatMap[passengerIndex];
        
        // ถ้าไม่มีที่นั่งใน segment นี้ แสดงว่ายังไม่ครบ
        if (!passengerSeat) {
          hasSeatInAllServiceSegments = false;
        }
      }
    });
    
    return hasSeatInAllServiceSegments;
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
                  label: seat.seatId,
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
        } 
        else {
          console.log("rowData", rowData);
          // ไม่มีข้อมูลแถวนี้ - ใส่ ที่นั่งจองแล้ว ทั้งหมด
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
    console.log('subscribeToSeatData - เริ่มต้น');
    this.passDataService.getSeatData().subscribe((data: any) => {
      console.log('subscribeToSeatData - ข้อมูลที่ได้รับ:', data);
      if (data && Object.keys(data).length > 0) {
        console.log('subscribeToSeatData - มีข้อมูล เริ่มโหลด');
        // โหลดข้อมูลทุก segment
        this.loadAllSegmentData(data);
        
        // โหลดข้อมูล segment ปัจจุบัน
        this.loadSegmentData();
        
        // ตรวจสอบและไปยัง segment ที่เหมาะสม
        setTimeout(() => {
          this.checkAndNavigateToIncompleteSegment();
        }, 100);
      } else {
        console.log('subscribeToSeatData - ไม่มีข้อมูล เริ่มโหลด segment ปัจจุบัน');
        // แม้ไม่มีข้อมูลที่บันทึกไว้ ก็ต้องโหลด segment ปัจจุบันเพื่อแสดง seatmap
        this.loadSegmentData();
        
        // ตรวจสอบและไปยัง segment ที่เหมาะสม
        setTimeout(() => {
          this.checkAndNavigateToIncompleteSegment();
        }, 100);
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

      console.log('setupSegments - segmentList:', this.segmentList);
    } catch (error) {
      console.error('Error in setupSegments:', error);
    }
  }

  // --- ฟังก์ชันเปลี่ยน segment ---
  switchSegment(segmentKey: string) {
    this.saveCurrentSegmentData();
    this.currentSegmentKey = segmentKey;
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
    
    console.log('loadSegmentData - currentSegmentKey:', this.currentSegmentKey);
    console.log('loadSegmentData - passengerSeatMap:', this.passengerSeatMap);
    console.log('loadSegmentData - selectedSeat:', this.selectedSeat);
    console.log('loadSegmentData - selectedSeatPrice:', this.selectedSeatPrice);
    console.log('loadSegmentData - segmentSelectedSeat:', this.segmentSelectedSeat);
  }

  // อัปเดต seatmap ตาม segment ปัจจุบัน
  updateSeatMapForCurrentSegment() {
    console.log('updateSeatMapForCurrentSegment - currentSegmentKey:', this.currentSegmentKey);
    console.log('updateSeatMapForCurrentSegment - outboundSeatMap length:', this.outboundSeatMap.length);
    console.log('updateSeatMapForCurrentSegment - inboundSeatMap length:', this.inboundSeatMap.length);
    
    if (this.currentSegmentKey.startsWith('outbound')) {
      // ใช้ seatmap ของ outbound
      if (this.outboundSeatMap.length > 0) {
        this.seatMap = JSON.parse(JSON.stringify(this.outboundSeatMap)); // deep copy
        console.log('updateSeatMapForCurrentSegment - เปลี่ยนเป็น outbound seatmap');
      } else {
        console.log('updateSeatMapForCurrentSegment - outbound seatmap ยังไม่พร้อม');
      }
    } else if (this.currentSegmentKey.startsWith('inbound')) {
      // ใช้ seatmap ของ inbound
      if (this.inboundSeatMap.length > 0) {
        this.seatMap = JSON.parse(JSON.stringify(this.inboundSeatMap)); // deep copy
        console.log('updateSeatMapForCurrentSegment - เปลี่ยนเป็น inbound seatmap');
      } else {
        console.log('updateSeatMapForCurrentSegment - inbound seatmap ยังไม่พร้อม');
      }
    }
  }

  // --- โหลดข้อมูลทุก segment จากข้อมูลที่บันทึกไว้ ---
  loadAllSegmentData(data: any) {
    console.log('loadAllSegmentData - ข้อมูลที่ได้รับ:', data);
    
    this.segmentList.forEach(seg => {
      // โหลดข้อมูลที่นั่งของแต่ละ segment
      this.segmentSeatMap[seg.key] = data[seg.key] || {};
      
      // โหลดข้อมูลราคาของแต่ละ segment
      this.segmentSelectedSeatPrice[seg.key] = data[`${seg.key}Price`] || 0;
      
      // โหลดข้อมูลที่นั่งที่เลือกของแต่ละ segment
      this.segmentSelectedSeat[seg.key] = data[`${seg.key}SelectedSeat`] || [];
      
      console.log(`loadAllSegmentData - ${seg.key}:`, this.segmentSeatMap[seg.key]);
      console.log(`loadAllSegmentData - ${seg.key}Price:`, this.segmentSelectedSeatPrice[seg.key]);
      console.log(`loadAllSegmentData - ${seg.key}SelectedSeat:`, this.segmentSelectedSeat[seg.key]);
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

  // --- ฟังก์ชันเลือกที่นั่ง (selectSeat) ใช้ logic เดิม ---
  selectSeat(seat: any) {
    if (this.selectedSeat.some(s => s.label === seat.label) && seat.status === 'selected') {
      // ยกเลิกการเลือกที่นั่ง
      seat.status = 'available';
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
    
    if (this.selectedSeat.length >= this.passengers.length) {
      return;
    }

    // ตรวจสอบที่นั่ง exit ก่อน
    if (seat.exit) {
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

  // เพิ่มฟังก์ชันใหม่สำหรับเลือกที่นั่งหลังจากยืนยันแล้ว
  selectSeatAfterConfirmation(seat: any) {
    // ตรวจสอบว่าที่นั่งที่เลือกไม่อยู่ใน service bundle หรือไม่
    const isCurrentSegmentFreeSeat = this.getCurrentSegmentFreeSeat();
    const seatType = this.getSeatTypeByServiceCode(seat.serviceCode);
    
    // ถ้า segment ปัจจุบันมี free seat แต่ที่นั่งที่เลือกเป็น premium seat
    if (isCurrentSegmentFreeSeat && (seatType === 'premium' || seatType === 'premium-plus')) {
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
    if (this.selectedSeat.length < this.passengers.length && seat.status === 'available') {
      seat.status = 'selected';
      const passengerIndex = this.passengers.findIndex((_, index) => !this.passengerSeatMap[index]);
      if (passengerIndex !== -1) {
        this.passengerSeatMap[passengerIndex] = seat.label;
      }
      this.selectedSeat.push(seat);
      this.SelectedSeat.push(seat.label);
      
      // คำนวณราคาตาม service bundle
      this.selectedSeatPrice = this.calculateCurrentSegmentPrice();
      
      this.saveCurrentSegmentData();
      this.loadSegmentData();
    }
  }

  // --- ฟังก์ชันยืนยันเลือกที่นั่ง ---
  confirmSelectSeat() {
    this.saveAllSegmentData();
    
    // เช็คว่าเลือกที่นั่งครบทุก segment แล้วหรือยัง
    const isAllSegmentsComplete = this.isAllSegmentsComplete();
    
    if (isAllSegmentsComplete) {
      // ถ้าเลือกครบแล้ว ไปหน้าต่อไปเลย
      console.log('confirmSelectSeat - เลือกที่นั่งครบทุก segment แล้ว ไปหน้าต่อไป');
      this.setPassengerData();
      this.router.navigate(['/review']);
      return;
    }
    
    // เช็คว่ามี segment ที่เลือกที่นั่งแล้วแต่เลือกไม่ครบทุกคน
    const { hasIncompleteSelection, incompleteSegments } = this.checkIncompleteSeatSelection();
    
    if (hasIncompleteSelection) {
      // แสดง dialog alert_select_seat_not_enough
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: { 
          isDialog: 'alert_select_seat_not_enough'
        }
      });
      
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          // ไปยัง segment แรกที่เลือกไม่ครบ
          const firstIncompleteSegment = incompleteSegments[0];
          if (firstIncompleteSegment && firstIncompleteSegment !== this.currentSegmentKey) {
            console.log(`confirmSelectSeat - ไปยัง segment ที่เลือกไม่ครบ: ${firstIncompleteSegment}`);
            this.switchSegment(firstIncompleteSegment);
          }
        }
      });
      return;
    }
    
    // เช็ค segment ที่มี service bundle และยังไม่ได้เลือกที่นั่ง
    const { hasUnselectedService, unselectedSegments } = this.checkRemainingServiceSegments();
    
    if (hasUnselectedService) {
      // ถ้ามี segment ที่มี service bundle แต่ยังไม่ได้เลือกที่นั่ง
      const nextSegment = this.findNextIncompleteServiceSegment();
      
      if (nextSegment && nextSegment !== this.currentSegmentKey) {
        // ไปยัง segment ที่ยังไม่เสร็จ
        console.log(`confirmSelectSeat - ไปยัง segment ที่ยังไม่เสร็จ: ${nextSegment}`);
        this.switchSegment(nextSegment);
        return;
      } else {
        // แสดง dialog เตือนให้เลือกที่นั่ง
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '350px',
          disableClose: true,
          data: { 
            isDialog: 'alert_select_seat',
            // message: `กรุณาเลือกที่นั่งฟรีสำหรับ: ${unselectedSegments.join(', ')}`
          }
        });
        
        dialogRef.afterClosed().subscribe((result: any) => {
          if (result.result === 'confirm') {
            this.setPassengerData();
            // ไม่ไปหน้าต่อไป ต้องเลือกที่นั่งก่อน
            return;
          }
        });
      }
    } else {
      // ถ้าไม่มี service bundle ที่ต้องเลือก หรือเลือกครบแล้ว
      // ตรวจสอบว่ามี segment ที่ไม่มี service bundle หรือไม่
      const { hasNonServiceSegments, nonServiceSegments, outboundHasNoService, inboundHasNoService } = this.checkNonServiceSegments();
      
      if (hasNonServiceSegments) {
        // สร้างข้อความแจ้งเตือน
        const warningMessage = this.getServiceBundleWarningMessage(outboundHasNoService, inboundHasNoService);
        
        // แสดง dialog alert_select_seat_not_include_package
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '350px',
          disableClose: true,
          data: { 
            isDialog: 'alert_select_seat_not_include_package',
            message: warningMessage,
            outboundHasNoService: outboundHasNoService,
            inboundHasNoService: inboundHasNoService
          }
        });
        
        dialogRef.afterClosed().subscribe((result: any) => {
          if (result.result === 'confirm') {
            // หา segment ที่ยังไม่เลือกที่นั่งครบ
            const incompleteSegment = this.findIncompleteSegment();
            if (incompleteSegment && incompleteSegment !== this.currentSegmentKey) {
              console.log(`confirmSelectSeat - ไปยัง segment ที่ยังไม่เลือกครบ: ${incompleteSegment}`);
              this.switchSegment(incompleteSegment);
            }
          } else {
            // ถ้าไม่สนใจ ไปหน้าต่อไป
            this.setPassengerData();
            this.router.navigate(['/review']);
          }
        });
      } else {
        // ถ้าไม่มี segment ที่ไม่มี service bundle ไปหน้าต่อไป
        this.setPassengerData();
        this.router.navigate(['/review']);
      }
    }
  }

  // --- ฟังก์ชันอื่นๆ (setPassengerData, setSeatData, updateSeatMapStatus, updateSeatMapFromCabinInfo2, subscribeToSeatData, etc.) ใช้ logic เดิม ---

  // ตรวจสอบว่าทุก segment เลือกครบหรือไม่
  isAllSegmentsComplete(): boolean {
    return this.segmentList.every(seg => 
      Object.keys(this.segmentSeatMap[seg.key]).length === this.passengers.length
    );
  }

  // ฟังก์ชันคำนวณราคารวมจากทุก segment
  calculateTotalPrice(): number {
    let totalPrice = 0;
    
    this.segmentList.forEach(segment => {
      // เช็คว่า segment นี้มี service bundle หรือไม่
      const segmentHasService = segment.key.startsWith('inbound') ? this.freeSeatInbound : this.freeSeatOutbound;
      
      if (segmentHasService) {
        // ถ้ามี service bundle ให้คำนวณเฉพาะ regular seats (S150) เป็นฟรี
        const segmentSeats = this.segmentSelectedSeat[segment.key] || [];
        segmentSeats.forEach((seat: any) => {
          if (seat.serviceCode === 'S150') {
            // regular seat ฟรี
            totalPrice += 0;
          } else {
            // premium/premium plus บวกเงินปกติ
            totalPrice += seat.amountIncludingVat || 0;
          }
        });
      } else {
        // ถ้าไม่มี service bundle ให้คำนวณราคาจากที่นั่งที่เลือกใน segment นั้น
        const segmentSeats = this.segmentSelectedSeat[segment.key] || [];
        segmentSeats.forEach((seat: any) => {
          totalPrice += seat.amountIncludingVat || 0;
        });
      }
    });

    this.passDataService.setTotalPrice(totalPrice);   
    
    return totalPrice;
  }

  // ฟังก์ชันคำนวณราคาสำหรับ segment ปัจจุบัน
  calculateCurrentSegmentPrice(): number {
    // เช็คว่า segment ปัจจุบันมี service bundle หรือไม่
    const currentSegmentHasService = this.getCurrentSegmentFreeSeat();
    
    // ถ้าไม่มี service bundle ให้คำนวณราคาจากที่นั่งที่เลือก
    if (!currentSegmentHasService) {
      return this.selectedSeat.reduce((sum, s) => sum + (s.amountIncludingVat || 0), 0);
    }
    
    // ถ้ามี service bundle ให้คำนวณเฉพาะ premium/premium plus
    return this.selectedSeat.reduce((sum, s) => {
      if (s.serviceCode === 'S150') {
        // regular seat ฟรี
        return sum;
      } else {
        // premium/premium plus บวกเงินปกติ
        return sum + (s.amountIncludingVat || 0);
      }
    }, 0);
  }

  // ปรับปรุงฟังก์ชัน getTotalPrice
  getTotalPrice(): number {
    return this.calculateTotalPrice();
  }

  // --- ฟังก์ชันสำหรับ UI ใหม่ ---
  
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
    }
  }

  // ได้ label ของ direction ปัจจุบัน
  getCurrentDirectionLabel(): string {
    return this.isInboundDirection() ? 'ขากลับ' : 'ขาไป';
  }

  // ได้ segments ของ direction ปัจจุบัน
  getCurrentDirectionSegments() {
    const direction = this.isInboundDirection() ? 'inbound' : 'outbound';
    return this.segmentList.filter(seg => seg.key.startsWith(direction));
  }

  // ได้หมายเลขไฟลต์จากข้อมูลจริง
  getFlightNumber(segmentKey: string): string {
    try {
      const flightData = this.passDataService.getFlightData();
      if (!flightData) return '';

      const direction = segmentKey.startsWith('inbound') ? 'inbound' : 'outbound';
      const segmentIndex = parseInt(segmentKey.replace(/\D/g, '')) - 1;
      
      if (direction === 'inbound' && flightData.inbound_flight_select?.flight_detail) {
        const flightDetail = flightData.inbound_flight_select.flight_detail[segmentIndex];
        if (flightDetail) {
          return flightDetail.flightNumber || '';
        }
      } else if (direction === 'outbound' && flightData.outbound_flight_select?.flight_detail) {
        const flightDetail = flightData.outbound_flight_select.flight_detail[segmentIndex];
        if (flightDetail) {
          return flightDetail.flightNumber || '';
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error getting flight number:', error);
      return '';
    }
  }

  // ได้ route ของไฟลต์จากข้อมูลจริง
  getFlightRoute(segmentKey: string): string {
    try {
      const flightData = this.passDataService.getFlightData();
      if (!flightData) return '';

      const direction = segmentKey.startsWith('inbound') ? 'inbound' : 'outbound';
      const segmentIndex = parseInt(segmentKey.replace(/\D/g, '')) - 1;
      
      if (direction === 'inbound' && flightData.inbound_flight_select?.flight_detail) {
        const flightDetail = flightData.inbound_flight_select.flight_detail[segmentIndex];
        if (flightDetail) {
          return `${flightDetail.originAirportCode} → ${flightDetail.destinationAirportCode}`;
        }
      } else if (direction === 'outbound' && flightData.outbound_flight_select?.flight_detail) {
        const flightDetail = flightData.outbound_flight_select.flight_detail[segmentIndex];
        if (flightDetail) {
          return `${flightDetail.originAirportCode} → ${flightDetail.destinationAirportCode}`;
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error getting flight route:', error);
      return '';
    }
  }

  // อัปเดตข้อมูล pricing จาก API seatmap แยกตาม Outbound/Inbound
  updatePricingFromAPI(seatMapPromise: Promise<any>, direction: 'outbound' | 'inbound') {
    try {
      seatMapPromise.then((seatMapData: any) => {
        if (seatMapData && seatMapData.cabinInfos && seatMapData.cabinInfos.length > 0) {
          const cabinInfo = seatMapData.cabinInfos[0];
          
          // ตรวจสอบ service bundle ตาม direction
          const flightData = this.passDataService.getFlightData();
          let hasService = false;
          
          if (direction === 'outbound' && flightData?.outbound_flight_select?.service_bundle) {
            hasService = flightData.outbound_flight_select.service_bundle.serviceName !== '';
          } else if (direction === 'inbound' && flightData?.inbound_flight_select?.service_bundle) {
            hasService = flightData.inbound_flight_select.service_bundle.serviceName !== '';
          }
          
          console.log(`${direction} hasService:`, hasService);
          
          // วนลูปผ่านทุก seat เพื่อหาราคาตาม serviceCode
          cabinInfo.seatMaps.forEach((row: any) => {
            row.seats.forEach((seat: any) => {
              if (seat.available) {
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
          
          console.log(`updatePricingFromAPI ${direction} - premiumPlusPrice:`, this.premiumPlusPrice);
          console.log(`updatePricingFromAPI ${direction} - premiumPrice:`, this.premiumPrice);
          console.log(`updatePricingFromAPI ${direction} - regularPrice:`, this.regularPrice);
          console.log(`updatePricingFromAPI ${direction} - hasService:`, hasService);
        }
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
      // เช็คว่า segment นี้มี service bundle หรือไม่
      const segmentHasService = segment.key.startsWith('inbound') ? this.freeSeatInbound : this.freeSeatOutbound;
      
      // ถ้ามี service bundle ให้เช็คว่าเลือกที่นั่งครบแล้วหรือยัง
      if (segmentHasService) {
        const segmentSeatMap = this.segmentSeatMap[segment.key] || {};
        const selectedSeatsCount = Object.keys(segmentSeatMap).length;
        
        // ถ้าเลือกที่นั่งไม่ครบ (น้อยกว่าจำนวนผู้โดยสาร)
        if (selectedSeatsCount < this.passengers.length) {
          hasUnselectedService = true;
          unselectedSegments.push(segment.key);
        }
      }
      // ถ้าไม่มี service bundle ไม่ต้องเช็คการเลือกที่นั่ง
    });

    return { hasUnselectedService, unselectedSegments };
  }

  // ฟังก์ชันเช็คว่า segment ปัจจุบันเลือกที่นั่งครบแล้วหรือยัง
  isCurrentSegmentComplete(): boolean {
    const currentSegmentSeatMap = this.segmentSeatMap[this.currentSegmentKey] || {};
    const selectedSeatsCount = Object.keys(currentSegmentSeatMap).length;
    return selectedSeatsCount >= this.passengers.length;
  }

  // ฟังก์ชันเช็คว่า segment ปัจจุบันมี service bundle และยังไม่ได้เลือกที่นั่งครบ
  isCurrentSegmentIncomplete(): boolean {
    const currentSegmentHasService = this.getCurrentSegmentFreeSeat();
    
    if (!currentSegmentHasService) {
      return false; // ไม่มี service bundle ไม่ต้องเช็ค
    }
    
    return !this.isCurrentSegmentComplete();
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
      const seatMapPromises: Promise<any>[] = [];

      // โหลดข้อมูล seatmap สำหรับ outbound flights
      if (flightData.outbound_flight_select?.flight_detail) {
        const outboundFlights = flightData.outbound_flight_select.flight_detail;
        totalToLoad += outboundFlights.length;
        
        outboundFlights.forEach((flight: any, index: number) => {
          const journeyKey = flightData.outbound_flight_select.journey_key;
          const fareKey = flightData.outbound_flight_select.fare_key;
          
          if (journeyKey && fareKey) {
            const promise = this.apiService.getSeatMap(journeyKey, fareKey).toPromise();
            this.updatePricingFromAPI(promise, 'outbound');
            seatMapPromises.push(promise);
            
            promise.then((data: any) => {
              console.log(`SeatMap Outbound ${index + 1}:`, data);
              if (data && data.cabinInfos && Array.isArray(data.cabinInfos)) {
                if (index === 0) {
                  this.outboundSeatMap = this.transformCabinInfoToSeatMap(data);
                }
                console.log(`outboundSeatMap ${index + 1} loaded:`, this.outboundSeatMap.length, "rows");
              }
              loadedCount++;
              this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
            }).catch((error) => {
              console.error(`Error loading outbound seatmap ${index + 1}:`, error);
              loadedCount++;
              this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
            });
          } else {
            loadedCount++;
            this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
          }
        });
      }

      // โหลดข้อมูล seatmap สำหรับ inbound flights (สำหรับ round-trip)
      if (flightData.inbound_flight_select?.flight_detail) {
        const inboundFlights = flightData.inbound_flight_select.flight_detail;
        totalToLoad += inboundFlights.length;
        
        inboundFlights.forEach((flight: any, index: number) => {
          const journeyKey = flightData.inbound_flight_select.journey_key;
          const fareKey = flightData.inbound_flight_select.fare_key;
          
          if (journeyKey && fareKey) {
            const promise = this.apiService.getSeatMap(journeyKey, fareKey).toPromise();
            this.updatePricingFromAPI(promise, 'inbound');
            seatMapPromises.push(promise);
            
            promise.then((data: any) => {
              console.log(`SeatMap Inbound ${index + 1}:`, data);
              if (data && data.cabinInfos && Array.isArray(data.cabinInfos)) {
                if (index === 0) {
                  this.inboundSeatMap = this.transformCabinInfoToSeatMap(data);
                }
                console.log(`inboundSeatMap ${index + 1} loaded:`, this.inboundSeatMap.length, "rows");
              }
              loadedCount++;
              this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
            }).catch((error) => {
              console.error(`Error loading inbound seatmap ${index + 1}:`, error);
              loadedCount++;
              this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
            });
          } else {
            loadedCount++;
            this.checkAllSeatMapsLoaded(loadedCount, totalToLoad);
          }
        });
      }

      console.log(`loadSeatMapData - totalToLoad: ${totalToLoad}, seatMapPromises: ${seatMapPromises.length}`);
    } catch (error) {
      console.error('Error in loadSeatMapData:', error);
    }
  }

  // เพิ่มฟังก์ชัน checkAllSeatMapsLoaded
  checkAllSeatMapsLoaded(loadedCount: number, totalToLoad: number) {
    console.log(`checkAllSeatMapsLoaded - loadedCount: ${loadedCount}, totalToLoad: ${totalToLoad}`);
    
    if (loadedCount >= totalToLoad) {
      console.log("checkAllSeatMapsLoaded - โหลดเสร็จแล้ว เริ่มโหลดข้อมูลที่นั่ง");
      
      // อัปเดต seatmap ตาม segment ปัจจุบัน
      this.updateSeatMapForCurrentSegment();
      
      // โหลดข้อมูลที่นั่งที่บันทึกไว้
      this.subscribeToSeatData();
      this.isLoading = false;
    }
  }

  // เพิ่มฟังก์ชันใหม่: หา segment ที่มีสิทธิ์เลือกที่นั่งแต่ยังไม่ได้เลือก
  findNextIncompleteServiceSegment(): string | null {
    // หา segment ที่มี service bundle แต่ยังไม่ได้เลือกที่นั่งครบ
    for (const segment of this.segmentList) {
      const segmentHasService = segment.key.startsWith('inbound') ? this.freeSeatInbound : this.freeSeatOutbound;
      
      if (segmentHasService) {
        const segmentSeatMap = this.segmentSeatMap[segment.key] || {};
        const selectedSeatsCount = Object.keys(segmentSeatMap).length;
        
        // ถ้าเลือกที่นั่งไม่ครบ (น้อยกว่าจำนวนผู้โดยสาร)
        if (selectedSeatsCount < this.passengers.length) {
          return segment.key;
        }
      }
    }
    return null;
  }

  // เพิ่มฟังก์ชันใหม่: ไปยัง segment ที่มีสิทธิ์เลือกที่นั่งแต่ยังไม่ได้เลือก
  goToNextIncompleteServiceSegment(): boolean {
    const nextSegment = this.findNextIncompleteServiceSegment();
    if (nextSegment) {
      console.log(`goToNextIncompleteServiceSegment - ไปยัง segment: ${nextSegment}`);
      this.switchSegment(nextSegment);
      return true;
    }
    return false;
  }

  // ปรับปรุงฟังก์ชัน subscribeToSeatData เพื่อตรวจสอบและไปยัง segment ที่เหมาะสม
  checkAndNavigateToIncompleteSegment() {
    // ถ้า segment ปัจจุบันไม่มี service bundle หรือเลือกครบแล้ว
    const currentSegmentHasService = this.getCurrentSegmentFreeSeat();
    const isCurrentComplete = this.isCurrentSegmentComplete();
    
    if (!currentSegmentHasService || isCurrentComplete) {
      // หา segment ที่มี service bundle แต่ยังไม่ได้เลือกครบ
      const nextSegment = this.findNextIncompleteServiceSegment();
      if (nextSegment && nextSegment !== this.currentSegmentKey) {
        console.log(`checkAndNavigateToIncompleteSegment - ไปยัง segment: ${nextSegment}`);
        this.switchSegment(nextSegment);
      }
    }
  }

  // เพิ่มฟังก์ชันใหม่: ตรวจสอบว่ามี segment ที่เลือกที่นั่งแล้วแต่เลือกไม่ครบทุกคน
  checkIncompleteSeatSelection(): { hasIncompleteSelection: boolean, incompleteSegments: string[] } {
    const incompleteSegments: string[] = [];
    let hasIncompleteSelection = false;

    this.segmentList.forEach(segment => {
      const segmentSeatMap = this.segmentSeatMap[segment.key] || {};
      const selectedSeatsCount = Object.keys(segmentSeatMap).length;
      
      // ถ้าเลือกที่นั่งแล้วแต่เลือกไม่ครบทุกคน
      if (selectedSeatsCount > 0 && selectedSeatsCount < this.passengers.length) {
        hasIncompleteSelection = true;
        incompleteSegments.push(segment.key);
      }
    });

    return { hasIncompleteSelection, incompleteSegments };
  }

  // ตรวจสอบว่ามีการเลือกที่นั่งใน segment ใดๆ หรือไม่
  hasSelectedSeatsInAnySegment(): boolean {
    return this.segmentList.some(segment => {
      const segmentSeats = this.segmentSelectedSeat[segment.key] || [];
      return segmentSeats.length > 0;
    });
  }

  // เพิ่มฟังก์ชันใหม่สำหรับหา segment ที่ไม่มี service bundle
  findNextNonServiceSegment(): string | null {
    // หา segment ที่ไม่มี service bundle
    for (const segment of this.segmentList) {
      const segmentHasService = segment.key.startsWith('inbound') ? this.freeSeatInbound : this.freeSeatOutbound;
      
      if (!segmentHasService) {
        return segment.key;
      }
    }
    return null;
  }

  // เพิ่มฟังก์ชันใหม่สำหรับหา segment ถัดไปที่ไม่มี service bundle จาก segment ปัจจุบัน
  findNextNonServiceSegmentFromCurrent(): string | null {
    // หา index ของ segment ปัจจุบัน
    const currentIndex = this.segmentList.findIndex(segment => segment.key === this.currentSegmentKey);
    
    if (currentIndex === -1) {
      return null;
    }
    
    // หา segment ถัดไปที่ไม่มี service bundle
    for (let i = currentIndex + 1; i < this.segmentList.length; i++) {
      const segment = this.segmentList[i];
      const segmentHasService = segment.key.startsWith('inbound') ? this.freeSeatInbound : this.freeSeatOutbound;
      
      if (!segmentHasService) {
        return segment.key;
      }
    }
    
    return null;
  }

  // เพิ่มฟังก์ชันใหม่สำหรับตรวจสอบ service bundle ของแต่ละทิศทาง
  checkServiceBundleForDirection(direction: 'outbound' | 'inbound'): boolean {
    if (direction === 'outbound') {
      return this.freeSeatOutbound;
    } else {
      return this.freeSeatInbound;
    }
  }

  // เพิ่มฟังก์ชันใหม่สำหรับตรวจสอบว่ามี segment ที่ไม่มี service bundle หรือไม่
  checkNonServiceSegments(): { 
    hasNonServiceSegments: boolean, 
    nonServiceSegments: string[],
    outboundHasNoService: boolean,
    inboundHasNoService: boolean 
  } {
    const nonServiceSegments: string[] = [];
    let hasNonServiceSegments = false;
    let outboundHasNoService = false;
    let inboundHasNoService = false;

    this.segmentList.forEach(segment => {
      const segmentHasService = segment.key.startsWith('inbound') ? this.freeSeatInbound : this.freeSeatOutbound;
      
      if (!segmentHasService) {
        hasNonServiceSegments = true;
        nonServiceSegments.push(segment.key);
        
        // ตรวจสอบว่าขาไหนไม่มี service bundle
        if (segment.key.startsWith('outbound')) {
          outboundHasNoService = true;
        } else if (segment.key.startsWith('inbound')) {
          inboundHasNoService = true;
        }
      }
    });

    return { 
      hasNonServiceSegments, 
      nonServiceSegments, 
      outboundHasNoService, 
      inboundHasNoService 
    };
  }

  // เพิ่มฟังก์ชันสำหรับสร้างข้อความแจ้งเตือน
  getServiceBundleWarningMessage(outboundHasNoService: boolean, inboundHasNoService: boolean): string {
    const flightData = this.passDataService.getFlightData();
    
    // ตรวจสอบ segment ปัจจุบัน
    const currentSegmentHasService = this.getCurrentSegmentFreeSeat();
    const currentSegmentIsComplete = this.isCurrentSegmentComplete();
    
    // เงื่อนไขที่ 1: ถ้า segment ปัจจุบันมี service bundle ให้แสดง message ของ segment ต่อไป
    // เงื่อนไขที่ 2: ถ้า segment ปัจจุบันไม่มี service bundle แต่เลือกที่นั่งครบแล้ว ให้แสดง message ของ segment ต่อไป
    if (currentSegmentHasService || (!currentSegmentHasService && currentSegmentIsComplete)) {
      // หา segment ถัดไปที่ไม่มี service bundle จาก segment ปัจจุบัน
      const nextNonServiceSegment = this.findNextNonServiceSegmentFromCurrent();
      
      if (nextNonServiceSegment) {
        // แสดง route ของ segment ถัดไปที่ไม่มี service bundle
        const direction = nextNonServiceSegment.startsWith('inbound') ? 'inbound' : 'outbound';
        const segmentIndex = parseInt(nextNonServiceSegment.replace(/\D/g, '')) - 1;
        
        let flightDetail;
        if (direction === 'inbound' && flightData?.inbound_flight_select?.flight_detail) {
          flightDetail = flightData.inbound_flight_select.flight_detail[segmentIndex];
        } else if (direction === 'outbound' && flightData?.outbound_flight_select?.flight_detail) {
          flightDetail = flightData.outbound_flight_select.flight_detail[segmentIndex];
        }
        
        if (flightDetail) {
          const origin = flightDetail.originAirportName || 'N/A';
          const destination = flightDetail.destinationAirportName || 'N/A';
          const route = `${origin} → ${destination}`;
          
          if (direction === 'inbound') {
            return `ขากลับ (${route}) ไม่มี service bundle`;
          } else {
            return `ขาไป (${route}) ไม่มี service bundle`;
          }
        }
      }
    }
    
    // เงื่อนไขที่ 3: ถ้า segment ปัจจุบันไม่มี service bundle และยังเลือกที่นั่งไม่ครบ ให้แสดง message ของ segment ปัจจุบัน
    if (!currentSegmentHasService && !currentSegmentIsComplete) {
      // แสดง route ของ segment ปัจจุบัน
      const direction = this.currentSegmentKey.startsWith('inbound') ? 'inbound' : 'outbound';
      const segmentIndex = parseInt(this.currentSegmentKey.replace(/\D/g, '')) - 1;
      
      let flightDetail;
      if (direction === 'inbound' && flightData?.inbound_flight_select?.flight_detail) {
        flightDetail = flightData.inbound_flight_select.flight_detail[segmentIndex];
      } else if (direction === 'outbound' && flightData?.outbound_flight_select?.flight_detail) {
        flightDetail = flightData.outbound_flight_select.flight_detail[segmentIndex];
      }
      
      if (flightDetail) {
        const origin = flightDetail.originAirportName || 'N/A';
        const destination = flightDetail.destinationAirportName || 'N/A';
        const route = `${origin} → ${destination}`;
        
        if (direction === 'inbound') {
          return `ขากลับ (${route}) ไม่มี service bundle`;
        } else {
          return `ขาไป (${route}) ไม่มี service bundle`;
        }
      }
    }
    
    return 'ไม่มี service bundle';
  }

  // เพิ่มฟังก์ชันสำหรับหา segment ที่ยังไม่เลือกที่นั่งครบ
  findIncompleteSegment(): string | null {
    // หา segment ที่ยังไม่เลือกที่นั่งครบทุกคน
    for (const segment of this.segmentList) {
      const segmentSeatMap = this.segmentSeatMap[segment.key] || {};
      const selectedSeatsCount = Object.keys(segmentSeatMap).length;
      
      // ถ้าเลือกที่นั่งไม่ครบ (น้อยกว่าจำนวนผู้โดยสาร)
      if (selectedSeatsCount < this.passengers.length) {
        return segment.key;
      }
    }
    return null;
  }
}
