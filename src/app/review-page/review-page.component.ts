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

interface FlightDetail {
  flightNumber: string;
  duration: string;
  aircraftDescription: string;
  isInternational: boolean;
  originAirportCode: string;
  originAirportName: string;
  destinationAirportCode: string;
  destinationAirportName: string;
  departureDateTime: string;
  arrivalDateTime: string;
}

interface ServiceBundle {
  originalAmount: number;
  discountPercentage: number;
  includedServices: any[];
  promotionalText: string;
  imageUrl: string;
  amount: number;
  amountIncludingVat: number;
  categoryId: number;
  currency: string;
  departureDate: string;
  description: string;
  flightNumber: string;
  logicalFlightId: number;
  paxTypeCode: string;
  physicalFlightId: number;
  serviceCode: string;
  serviceId: number;
  serviceName: string;
  vatAmount: number;
}

interface SeatData {
  inbound1: string[];
  inbound1Price: number;
  inbound1SelectedSeat: SelectedSeat[];
  inbound2: string[];
  inbound2Price: number;
  inbound2SelectedSeat: SelectedSeat[];
  outbound1: string[];
  outbound1Price: number;
  outbound1SelectedSeat: SelectedSeat[];
  outbound2: string[];
  outbound2Price: number;
  outbound2SelectedSeat: SelectedSeat[];
}

interface ConvertedSeatData {
  segment: string;
  seats: string[];
  selectedSeats: SelectedSeat[];
  price: number;
  totalSeats: number;
  selectedCount: number;
  // map: passengerIndex -> seatLabel
  seatMap: { [key: number]: string };
}

interface SelectedSeat {
  label: string;
  status: string;
  type: string;
  price: number;
  exit: boolean;
}

// Type guard functions
// function isSeatData(value: any): value is { [key: number]: string } {
//   return typeof value === 'object' && value !== null && !Array.isArray(value);
// }

// interface FlightSelection {
//   fare_key: string;
//   flight_detail: FlightDetail[];
//   journey_key: string;
//   service_bundle: ServiceBundle;
//   trip_type: string;
// }

// interface FlightSearch {
//   user_id: string;
//   origin: string;
//   destination: string;
//   adults: string;
//   children: string;
// }

// interface FlightData {
//   flight_search: FlightSearch;
//   inbound_flight_select: FlightSelection;
//   outbound_flight_select: FlightSelection;
// }

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
  seatData: ConvertedSeatData[] = [];
  flightData: FlightDetail[] = [];
  outboundFlightData: FlightDetail[] = [];
  inboundFlightData: FlightDetail[] = [];
  outboundServiceBundle: ServiceBundle | null = null;
  inboundServiceBundle: ServiceBundle | null = null;

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
          // this.seatData = data as { [key: string]: { [key: number]: string } };
          // console.log("seatData",this.seatData);
          this.seatData = this.convertSeatData(data);
        } else {
          this.seatData = [];
        }
      });

      this.passDataService.getPassengerInfo().subscribe((data: any) => {
        if (data && Object.keys(data).length > 0) {
          console.log("getFlightData review-page", data);
          this.getFlightDetail(data);
        } else {
          this.outboundFlightData = [];
          this.inboundFlightData = [];
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

  convertSeatData(seatData: any) {
    console.log("convertSeatData", seatData);
    
    if (!seatData || typeof seatData !== 'object') {
      return [];
    }

    let convertedData: any[] = [];
    
    // ตรวจสอบและแปลงข้อมูลแต่ละ flight segment
    const flightSegments = ['outbound1', 'outbound2', 'inbound1', 'inbound2'];
    
    flightSegments.forEach(segment => {
      if (seatData[segment]) {
        // เก็บ map เดิม (passengerIndex -> seatLabel) และแปลงข้อมูลที่นั่งเป็น array
        const seatMapObj = seatData[segment] as { [key: number]: string };
        const seatArray = Object.values(seatMapObj);
        const selectedSeats = seatData[`${segment}SelectedSeat`] || [];
        const price = seatData[`${segment}Price`] || 0;
        
        convertedData.push({
          segment: segment,
          seats: seatArray,
          selectedSeats: selectedSeats,
          price: price,
          totalSeats: seatArray.length,
          selectedCount: selectedSeats.length,
          seatMap: seatMapObj
        });
      }
    });
    
    
    this.seatData = convertedData;
    console.log("Converted seat data:", convertedData);
    return convertedData;
  }

  // หาข้อมูล segment
  private getSegmentData(segment: string): ConvertedSeatData | undefined {
    return this.seatData.find(item => item.segment === segment);
  }

  // ดึงรายการที่นั่งที่เลือกของ segment
  getSelectedSeatsForSegment(segment: string): SelectedSeat[] {
    const seg = this.getSegmentData(segment);
    return seg && Array.isArray(seg.selectedSeats) ? seg.selectedSeats : [];
  }

  // หา passengerIndex จาก seat label ใน segment
  getPassengerIndexBySeat(segment: string, label: string): number {
    const seg = this.getSegmentData(segment);
    if (!seg || !seg.seatMap) return -1;
    const entries = Object.entries(seg.seatMap);
    for (const [idxStr, seatLabel] of entries) {
      if (seatLabel === label) return parseInt(idxStr, 10);
    }
    return -1;
  }

  // แสดงชื่อผู้โดยสารจาก index
  getPassengerNameByIndex(index: number): string {
    const p = this.passengers && this.passengers[index];
    if (!p) return '';
    return `${p.firstName} ${p.lastName}`.trim();
  }

  // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งตาม segment และ passenger index
  getSeatBySegmentAndPassenger(segment: string, passengerIndex: number): string {
    if (!this.seatData || !Array.isArray(this.seatData)) {
      return '';
    }
    
    const segmentData = this.seatData.find(item => item.segment === segment);
    if (!segmentData || !segmentData.seats || !Array.isArray(segmentData.seats)) {
      return '';
    }
    
    return segmentData.seats[passengerIndex] || '';
  }

  // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งขาไป
  getOutboundSeat(passengerIndex: number): string {
    return this.getSeatBySegmentAndPassenger('outbound1', passengerIndex);
  }

  // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งขากลับ
  getInboundSeat(passengerIndex: number): string {
    return this.getSeatBySegmentAndPassenger('inbound1', passengerIndex);
  }

  // ฟังก์ชันสำหรับดึงข้อมูลที่นั่ง connect flight ขาไป
  getOutbound2Seat(passengerIndex: number): string {
    return this.getSeatBySegmentAndPassenger('outbound2', passengerIndex);
  }

  // ฟังก์ชันสำหรับดึงข้อมูลที่นั่ง connect flight ขากลับ
  getInbound2Seat(passengerIndex: number): string {
    return this.getSeatBySegmentAndPassenger('inbound2', passengerIndex);
  }

  // ฟังก์ชันสำหรับตรวจสอบว่ามีข้อมูลที่นั่งขาไปหรือไม่
  hasOutboundSeats(): boolean {
    if (!this.seatData || !Array.isArray(this.seatData)) {
      return false;
    }
    return this.seatData.some(item => item.segment === 'outbound1' && item.seats && item.seats.length > 0);
  }

  // ฟังก์ชันสำหรับตรวจสอบว่ามีข้อมูลที่นั่งขากลับหรือไม่
  hasInboundSeats(): boolean {
    if (!this.seatData || !Array.isArray(this.seatData)) {
      return false;
    }
    return this.seatData.some(item => item.segment === 'inbound1' && item.seats && item.seats.length > 0);
  }

  // ฟังก์ชันสำหรับตรวจสอบว่ามีข้อมูลที่นั่ง connect flight ขาไปหรือไม่
  hasOutbound2Seats(): boolean {
    if (!this.seatData || !Array.isArray(this.seatData)) {
      return false;
    }
    return this.seatData.some(item => item.segment === 'outbound2' && item.seats && item.seats.length > 0);
  }

  // ฟังก์ชันสำหรับตรวจสอบว่ามีข้อมูลที่นั่ง connect flight ขากลับหรือไม่
  hasInbound2Seats(): boolean {
    if (!this.seatData || !Array.isArray(this.seatData)) {
      return false;
    }
    return this.seatData.some(item => item.segment === 'inbound2' && item.seats && item.seats.length > 0);
  }

  // // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งทั้งหมด
  // getAllSeatData(): any[] {
  //   const segments = ['outbound1', 'outbound2', 'inbound1', 'inbound2'];
  //   const allSeatData: any[] = [];
    
  //   segments.forEach(segment => {
  //     const seatInfo = this.getSeatDataBySegment(segment);
  //     if (seatInfo) {
  //       allSeatData.push(seatInfo);
  //     }
  //   });
    
  //   return allSeatData;
  // }

  // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งที่เลือกแล้ว
  // getSelectedSeatsBySegment(segment: string): SelectedSeat[] {
  //   const seatInfo = this.getSeatDataBySegment(segment);
  //   return seatInfo ? seatInfo.selectedSeats : [];
  // }

  // ฟังก์ชันสำหรับดึงราคาตาม segment
  // getSeatPriceBySegment(segment: string): number {
  //   const seatInfo = this.getSeatDataBySegment(segment);
  //   return seatInfo ? seatInfo.price : 0;
  // }

  // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งที่เลือกแล้วทั้งหมด
  // getAllSelectedSeats(): SelectedSeat[] {
  //   const segments = ['outbound1', 'outbound2', 'inbound1', 'inbound2'];
  //   let allSelectedSeats: SelectedSeat[] = [];
    
  //   segments.forEach(segment => {
  //     const selectedSeats = this.getSelectedSeatsBySegment(segment);
  //     allSelectedSeats = allSelectedSeats.concat(selectedSeats);
  //   });
    
  //   return allSelectedSeats;
  // }

  // // ฟังก์ชันสำหรับคำนวณราคารวมทั้งหมด
  // getTotalSeatPrice(): number {
  //   const segments = ['outbound1', 'outbound2', 'inbound1', 'inbound2'];
  //   let totalPrice = 0;
    
  //   segments.forEach(segment => {
  //     totalPrice += this.getSeatPriceBySegment(segment);
  //   });
    
  //   return totalPrice;
  // }

  // // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งที่เลือกแล้วเป็น string
  // getSelectedSeatsString(segment: string): string {
  //   const selectedSeats = this.getSelectedSeatsBySegment(segment);
  //   if (selectedSeats.length === 0) {
  //     return 'ไม่มีการเลือกที่นั่ง';
  //   }
    
  //   return selectedSeats.map(seat => seat.label).join(', ');
  // }

  // // ฟังก์ชันสำหรับตรวจสอบว่ามีการเลือกที่นั่งหรือไม่
  // hasSelectedSeats(segment: string): boolean {
  //   const selectedSeats = this.getSelectedSeatsBySegment(segment);
  //   return selectedSeats.length > 0;
  // }

  // // ฟังก์ชันสำหรับดึงข้อมูลที่นั่งที่เลือกแล้วทั้งหมดเป็น string
  // getAllSelectedSeatsString(): string {
  //   const allSelectedSeats = this.getAllSelectedSeats();
  //   if (allSelectedSeats.length === 0) {
  //     return 'ไม่มีการเลือกที่นั่ง';
  //   }
    
  //   return allSelectedSeats.map(seat => seat.label).join(', ');
  // }

  // getPassengerSeat(passengerIndex: number, flight: string, segment: number = 1): string {
  //   const seatKey = `${flight}${segment}` as keyof SeatData;
  //   const seatData = this.seatData[seatKey];
  //   if (seatData && typeof seatData === 'object' && !Array.isArray(seatData) && seatData[passengerIndex]) {
  //     return seatData[passengerIndex];
  //   }
  //   return '';
  // }

  hasSeatData(): boolean {
    return Object.keys(this.seatData).length > 0;
  }

  getFlightSegments(flightType: string): string[] {
    console.log("getFlightSegments",this.seatData);
    
    return Object.keys(this.seatData).filter(key => key.startsWith(flightType));
  }

  getFlightDetail(data: any): void {
    console.log("getFlightDetail review-page", data);
    
    // Reset flight data
    this.outboundFlightData = [];
    this.inboundFlightData = [];
    this.outboundServiceBundle = null;
    this.inboundServiceBundle = null;
    
    if (data) {
      console.log("outbound_flight_select:", data.outbound_flight_select);
      console.log("inbound_flight_select:", data.inbound_flight_select);
      
      // ตรวจสอบ outbound flight
      if (data.outbound_flight_select && data.outbound_flight_select.flight_detail) {
        this.outboundFlightData = data.outbound_flight_select.flight_detail as FlightDetail[];
        console.log("outboundFlightData processed:", this.outboundFlightData);
      }
      
      // ตรวจสอบ inbound flight
      if (data.inbound_flight_select && data.inbound_flight_select.flight_detail) {
        this.inboundFlightData = data.inbound_flight_select.flight_detail as FlightDetail[];
        console.log("inboundFlightData processed:", this.inboundFlightData);
      }
      
      // เก็บข้อมูล service bundle ขาไป
      if (data.outbound_flight_select && data.outbound_flight_select.service_bundle) {
        this.outboundServiceBundle = data.outbound_flight_select.service_bundle as ServiceBundle;
        console.log("outboundServiceBundle:", this.outboundServiceBundle);
      }
      
      // เก็บข้อมูล service bundle ขากลับ
      if (data.inbound_flight_select && data.inbound_flight_select.service_bundle) {
        this.inboundServiceBundle = data.inbound_flight_select.service_bundle as ServiceBundle;
        console.log("inboundServiceBundle:", this.inboundServiceBundle);
      }
      
      // สำหรับข้อมูล flight_detail ที่อยู่โดยตรง (fallback)
      if (data.flight_detail && Array.isArray(data.flight_detail)) {
        if (this.outboundFlightData.length === 0) {
          this.outboundFlightData = data.flight_detail as FlightDetail[];
          console.log("flight_detail assigned to outbound:", this.outboundFlightData);
        }
      }
    }
    
    console.log("Final flight data - Outbound:", this.outboundFlightData.length, "Inbound:", this.inboundFlightData.length);
  }

  getFlightDate(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    };
    return date.toLocaleDateString('th-TH', options);
  }

  getFlightTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  getTotalDuration(flights: FlightDetail[]): string {
    if (!flights || flights.length === 0) return '';
    
    // คำนวณเวลารวมจากเที่ยวบินแรกและเที่ยวบินสุดท้าย
    const firstFlight = flights[0];
    const lastFlight = flights[flights.length - 1];
    
    if (firstFlight && lastFlight) {
      const departureTime = new Date(firstFlight.departureDateTime);
      const arrivalTime = new Date(lastFlight.arrivalDateTime);
      const diffMs = arrivalTime.getTime() - departureTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHours}h ${diffMinutes}m`;
    }
    
    return flights[0]?.duration || '';
  }

  getFlightNumbers(flights: FlightDetail[]): string {
    if (!flights || flights.length === 0) return '';
    
    return flights.map(flight => flight.flightNumber).join(' | ');
  }

  getSpecialAssistanceList(passenger: Passenger): string {
    const items: string[] = [];
    if (passenger.monk) items.push('พระภิกษุ');
    if (passenger.nun) items.push('แม่ชี');
    if (passenger.disabledVision) items.push('ผู้บกพร่องทางสายตา/ตาบอด');
    if (passenger.disabledHearing) items.push('ผู้บกพร่องทางการได้ยิน/หูหนวก');
    if (passenger.pregnantWoman) items.push('สตรีตั้งครรภ์');
    if (passenger.wheelchairUser) items.push('รถเข็น วีลเเชร์');
    if (passenger.unaccompaniedMinor) items.push('เด็กเดินทางคนเดียว');
    if (passenger.other) items.push(`อื่นๆ (ระบุ) ${passenger.otherReason || ''}`.trim());
    return items.join(', ');
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

  // hasOutboundSeat(passengerIndex: number): boolean {
  //   return this.getFlightSegments('outbound').some(segment => 
  //     this.getPassengerSeat(passengerIndex, 'outbound', parseInt(segment.replace('outbound', ''))) !== ''
  //   );
  // }

  // hasInboundSeat(passengerIndex: number): boolean {
  //   return this.getFlightSegments('inbound').some(segment => 
  //     this.getPassengerSeat(passengerIndex, 'inbound', parseInt(segment.replace('inbound', ''))) !== ''
  //   );
  // }

  // getAllOutboundSeats(passengerIndex: number): string {
  //   const seats = this.getFlightSegments('outbound')
  //     .map(segment => this.getPassengerSeat(passengerIndex, 'outbound', parseInt(segment.replace('outbound', ''))))
  //     .filter(seat => seat !== '');
  //   return seats.join(', ');
  // }

  // getAllInboundSeats(passengerIndex: number): string {
  //   const seats = this.getFlightSegments('inbound')
  //     .map(segment => this.getPassengerSeat(passengerIndex, 'inbound', parseInt(segment.replace('inbound', ''))))
  //     .filter(seat => seat !== '');
  //   return seats.join(', ');
  // }

  // getOutboundSeatInfo(passengerIndex: number): string {
  //   const segments = this.getFlightSegments('outbound');
    
  //   if (segments.length === 1) {
  //     return this.getPassengerSeat(passengerIndex, 'outbound', parseInt(segments[0].replace('outbound', '')));
  //   } else {
  //     return segments.map((segment, index) => {
  //       const seat = this.getPassengerSeat(passengerIndex, 'outbound', parseInt(segment.replace('outbound', '')));
  //       return seat ? `เครื่อง${index + 1}: ${seat}` : '';
  //     }).filter(info => info !== '').join(', ');
  //   }
  // }

  // getInboundSeatInfo(passengerIndex: number): string {
  //   const segments = this.getFlightSegments('inbound');
  //   if (segments.length === 1) {
  //     return this.getPassengerSeat(passengerIndex, 'inbound', parseInt(segments[0].replace('inbound', '')));
  //   } else {
  //     return segments.map((segment, index) => {
  //       const seat = this.getPassengerSeat(passengerIndex, 'inbound', parseInt(segment.replace('inbound', '')));
  //       return seat ? `เครื่อง${index + 1}: ${seat}` : '';
  //     }).filter(info => info !== '').join(', ');
  //   }
  // }

  // Methods สำหรับจัดการข้อมูล service bundle
  hasOutboundServiceBundle(): boolean {
    return this.outboundServiceBundle !== null && 
           !!this.outboundServiceBundle.serviceName && 
           this.outboundServiceBundle.serviceName.trim() !== '';
  }

  hasInboundServiceBundle(): boolean {
    return this.inboundServiceBundle !== null && 
           !!this.inboundServiceBundle.serviceName && 
           this.inboundServiceBundle.serviceName.trim() !== '';
  }

  getServiceBundleInfo(bundle: ServiceBundle): string {
    if (!bundle) return '';
    return `${bundle.serviceName} - ${bundle.description}`;
  }

  getServiceBundlePrice(bundle: ServiceBundle): string {
    if (!bundle) return '';
    return `${bundle.amountIncludingVat} ${bundle.currency}`;
  }

  getServiceBundleOriginalPrice(bundle: ServiceBundle): string {
    if (!bundle) return '';
    return `${bundle.originalAmount} ${bundle.currency}`;
  }

  getServiceBundleDiscount(bundle: ServiceBundle): string {
    if (!bundle || bundle.discountPercentage === 0) return '';
    return `-${bundle.discountPercentage}%`;
  }

  // Helper methods สำหรับตรวจสอบ discount
  hasOutboundDiscount(): boolean {
    return this.outboundServiceBundle !== null && 
           this.outboundServiceBundle.discountPercentage > 0;
  }

  hasInboundDiscount(): boolean {
    return this.inboundServiceBundle !== null && 
           this.inboundServiceBundle.discountPercentage > 0;
  }

  // Helper methods สำหรับตรวจสอบ original price
  hasOutboundOriginalPrice(): boolean {
    return this.outboundServiceBundle !== null && 
           this.outboundServiceBundle.originalAmount !== this.outboundServiceBundle.amount;
  }

  hasInboundOriginalPrice(): boolean {
    return this.inboundServiceBundle !== null && 
           this.inboundServiceBundle.originalAmount !== this.inboundServiceBundle.amount;
  }

  // Helper methods สำหรับตรวจสอบ promotional text
  hasOutboundPromotionalText(): boolean {
    return this.outboundServiceBundle !== null && 
           !!this.outboundServiceBundle.promotionalText && 
           this.outboundServiceBundle.promotionalText.trim() !== '';
  }

  hasInboundPromotionalText(): boolean {
    return this.inboundServiceBundle !== null && 
           !!this.inboundServiceBundle.promotionalText && 
           this.inboundServiceBundle.promotionalText.trim() !== '';
  }

  // ฟังก์ชันใหม่สำหรับแสดงจำนวนเครื่องบิน
  getAircraftCount(flightType: string): number {
    if (flightType === 'outbound') {
      return this.outboundFlightData.length;
    } else if (flightType === 'inbound') {
      return this.inboundFlightData.length;
    }
    return 0;
  }

  // ฟังก์ชันสำหรับแสดงข้อมูลเครื่องบิน
  getAircraftInfo(flightType: string): string {
    let flights: FlightDetail[] = [];
    
    if (flightType === 'outbound') {
      flights = this.outboundFlightData;
    } else if (flightType === 'inbound') {
      flights = this.inboundFlightData;
    }

    if (flights.length === 0) return '';

    if (flights.length === 1) {
      return `${flights[0].aircraftDescription}`;
    } else {
      return flights.map((flight, index) => 
        `เครื่อง${index + 1}: ${flight.aircraftDescription}`
      ).join(', ');
    }
  }

  // ฟังก์ชันสำหรับแสดงข้อมูลเที่ยวบิน
  getFlightInfo(flightType: string): string {
    let flights: FlightDetail[] = [];
    
    if (flightType === 'outbound') {
      flights = this.outboundFlightData;
    } else if (flightType === 'inbound') {
      flights = this.inboundFlightData;
    }

    if (flights.length === 0) return '';

    if (flights.length === 1) {
      const flight = flights[0];
      return `${flight.flightNumber} (${flight.originAirportCode} → ${flight.destinationAirportCode})`;
    } else {
      return flights.map((flight, index) => 
        `เครื่อง${index + 1}: ${flight.flightNumber} (${flight.originAirportCode} → ${flight.destinationAirportCode})`
      ).join(', ');
    }
  }

  // // ฟังก์ชันสำหรับแสดงข้อมูลที่นั่งพร้อมข้อมูลเครื่องบิน
  // getOutboundSeatInfoWithAircraft(passengerIndex: number): string {
  //   const segments = this.getFlightSegments('outbound');
    
  //   if (segments.length === 1) {
  //     const seat = this.getPassengerSeat(passengerIndex, 'outbound', parseInt(segments[0].replace('outbound', '')));
  //     return seat;
  //   } else {
  //     return segments.map((segment, index) => {
  //       const seat = this.getPassengerSeat(passengerIndex, 'outbound', parseInt(segment.replace('outbound', '')));
  //       return seat ? `เครื่อง${index + 1}: ${seat}` : '';
  //     }).filter(info => info !== '').join(', ');
  //   }
  // }

  // getInboundSeatInfoWithAircraft(passengerIndex: number): string {
  //   const segments = this.getFlightSegments('inbound');
    
  //   if (segments.length === 1) {
  //     const seat = this.getPassengerSeat(passengerIndex, 'inbound', parseInt(segments[0].replace('inbound', '')));
  //     return seat;
  //   } else {
  //     return segments.map((segment, index) => {
  //       const seat = this.getPassengerSeat(passengerIndex, 'inbound', parseInt(segment.replace('inbound', '')));
  //       return seat ? `เครื่อง${index + 1}: ${seat}` : '';
  //     }).filter(info => info !== '').join(', ');
  //   }
  // }

  // // ฟังก์ชันใหม่สำหรับเข้าถึงข้อมูลแบบ object
  // getSeatData(flight: string, segment: number): { [key: number]: string } | undefined {
  //   const seatKey = `${flight}${segment}` as keyof SeatData;
  //   const seatData = this.seatData[seatKey];
  //   if (seatData && typeof seatData === 'object' && !Array.isArray(seatData)) {
  //     return seatData as { [key: number]: string };
  //   }
  //   return undefined;
  // }

  // getSeatPrice(flight: string, segment: number): number | undefined {
  //   const priceKey = `${flight}${segment}Price` as keyof SeatData;
  //   const price = this.seatData[priceKey];
  //   if (typeof price === 'number') {
  //     return price;
  //   }
  //   return undefined;
  // }

  // getSelectedSeats(flight: string, segment: number): SelectedSeat[] | undefined {
  //   const selectedKey = `${flight}${segment}SelectedSeat` as keyof SeatData;
  //   const selectedSeats = this.seatData[selectedKey];
  //   if (Array.isArray(selectedSeats)) {
  //     return selectedSeats as SelectedSeat[];
  //   }
  //   return undefined;
  // }
}
