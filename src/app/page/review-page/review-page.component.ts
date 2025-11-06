import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PassDataService } from '../../core/services/pass-data.service';

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
  // bundle selections
  outboundBundleIndex?: number;
  outboundBundle?: PassengerBundle;
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

// โครงสร้าง bundle ที่มากับข้อมูลผู้โดยสารใน formData
interface PassengerBundleDetail {
  serviceCode: string;
  serviceName: string;
  description: string;
}

interface PassengerBundle {
  icon: string;
  title: string;
  price: number;
  original?: number;
  discount?: number;
  serviceCode: string;
  serviceCodeDetail?: string;
  paxTypeCode?: string;
  flightNumber?: string;
  details?: PassengerBundleDetail[];
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
  segment: Segment;
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

type Direction = 'outbound' | 'inbound';
type Segment = 'outbound1' | 'outbound2' | 'inbound1' | 'inbound2';
const FLIGHT_SEGMENTS: Segment[] = ['outbound1', 'outbound2', 'inbound1', 'inbound2'];

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
  // toggle แสดง/ซ่อนรายชื่อผู้โดยสารที่ซื้อ bundle
  outboundBundleShow: boolean = true;
  inboundBundleShow: boolean = true;
  // แยกสถานะย่อ/ขยายต่อกลุ่ม (key ใช้ title ของ bundle)
  outboundBundleGroupOpen: { [title: string]: boolean } = {};
  inboundBundleGroupOpen: { [title: string]: boolean } = {};
  // ข้อมูล bundle (หลังรวม/แปลง) ที่ใช้แสดงผลจริง
  outboundBundleDisplay: ServiceBundle | null = null;
  inboundBundleDisplay: ServiceBundle | null = null;
  // รายชื่อ index ผู้โดยสารที่ซื้อ bundle
  outboundBundlePassengerIndexes: number[] = [];
  inboundBundlePassengerIndexes: number[] = [];

  // กลุ่ม bundle ขาไปและขากลับ (จัดตาม title ไม่ซ้ำ)
  outboundBundleGroups: { title: string; passengers: Passenger[]; sample: ServiceBundle | null }[] = [];
  inboundBundleGroups: { title: string; passengers: Passenger[]; sample: ServiceBundle | null }[] = [];

  constructor(
    private router: Router,
    private passDataService: PassDataService,
    // private translate: TranslateService
    ) { 
      this.passDataService.getFormData().subscribe((data: any) => {
        if (data && Object.keys(data).length > 0) {
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
          // อัปเดตข้อมูล bundle จากผู้โดยสาร (fallback)
          this.updateBundleDisplays();
        } else {
          this.formData = [];
          this.passengers = [];
          this.isPassengerInfoOpen = [];
          this.outboundBundlePassengerIndexes = [];
          this.inboundBundlePassengerIndexes = [];
          this.updateBundleDisplays();
        }
      });

      this.passDataService.getSeatData().subscribe((data: any) => {
        if (data && Object.keys(data).length > 0) {
          // this.seatData = data as { [key: string]: { [key: number]: string } };
          // console.log("seatData",this.seatData);
          this.seatData = this.convertSeatData(data);
        } else {
          this.seatData = [];
        }
      });

      this.passDataService.getPassengerInfo().subscribe((data: any) => {
        if (data && Object.keys(data).length > 0) {
          this.getFlightDetail(data);
          // อัปเดตข้อมูล bundle หลังได้ flight detail
          this.updateBundleDisplays();
        } else {
          this.outboundFlightData = [];
          this.inboundFlightData = [];
          this.updateBundleDisplays();
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
  }

  convertSeatData(seatData: any): ConvertedSeatData[] {
    if (!seatData || typeof seatData !== 'object') {
      return [];
    }

    const convertedData: ConvertedSeatData[] = [];
    const flightSegments: Segment[] = FLIGHT_SEGMENTS;

    // ตรวจสอบและแปลงข้อมูลแต่ละ flight segment
    flightSegments.forEach((segment: Segment) => {
      if (seatData[segment]) {
        // เก็บ map เดิม (passengerIndex -> seatLabel) และแปลงข้อมูลที่นั่งเป็น array
        const seatMapObj = seatData[segment] as { [key: number]: string };
        const seatArray = Object.values(seatMapObj);
        const selectedSeats = seatData[`${segment}SelectedSeat`] || [];
        const price = seatData[`${segment}Price`] || 0;

        convertedData.push({
          segment,
          seats: seatArray,
          selectedSeats,
          price,
          totalSeats: seatArray.length,
          selectedCount: selectedSeats.length,
          seatMap: seatMapObj
        });
      }
    });

    this.seatData = convertedData;
    return convertedData;
  }

  // หาข้อมูล segment
  private getSegmentData(segment: Segment): ConvertedSeatData | undefined {
    return this.seatData.find(item => item.segment === segment);
  }

  // ดึงรายการที่นั่งที่เลือกของ segment
  getSelectedSeatsForSegment(segment: Segment): SelectedSeat[] {
    const seg = this.getSegmentData(segment);
    return seg && Array.isArray(seg.selectedSeats) ? seg.selectedSeats : [];
  }

  // หา passengerIndex จาก seat label ใน segment
  getPassengerIndexBySeat(segment: Segment, label: string): number {
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
  getSeatBySegmentAndPassenger(segment: Segment, passengerIndex: number): string {
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

  

  hasSeatData(): boolean {
    return Array.isArray(this.seatData) && this.seatData.length > 0;
  }


  getFlightDetail(data: any): void {
    
    // Reset flight data
    this.outboundFlightData = [];
    this.inboundFlightData = [];
    this.outboundServiceBundle = null;
    this.inboundServiceBundle = null;
    
    if (data) {
      
      // ตรวจสอบ outbound flight
      if (data.outbound_flight_select && data.outbound_flight_select.flight_detail) {
        this.outboundFlightData = data.outbound_flight_select.flight_detail as FlightDetail[];
      }
      
      // ตรวจสอบ inbound flight
      if (data.inbound_flight_select && data.inbound_flight_select.flight_detail) {
        this.inboundFlightData = data.inbound_flight_select.flight_detail as FlightDetail[];
      }
      
      // เก็บข้อมูล service bundle ขาไป
      if (data.outbound_flight_select && data.outbound_flight_select.service_bundle) {
        this.outboundServiceBundle = data.outbound_flight_select.service_bundle as ServiceBundle;
      }
      
      // เก็บข้อมูล service bundle ขากลับ
      if (data.inbound_flight_select && data.inbound_flight_select.service_bundle) {
        this.inboundServiceBundle = data.inbound_flight_select.service_bundle as ServiceBundle;
      }
      
      // สำหรับข้อมูล flight_detail ที่อยู่โดยตรง (fallback)
      if (data.flight_detail && Array.isArray(data.flight_detail)) {
        if (this.outboundFlightData.length === 0) {
          this.outboundFlightData = data.flight_detail as FlightDetail[];
        }
      }
    }
    
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

  // toggle รายชื่อผู้โดยสารของ bundle
  toggleOutboundBundlePassengers() {
    this.outboundBundleShow = !this.outboundBundleShow;
  }

  toggleInboundBundlePassengers() {
    this.inboundBundleShow = !this.inboundBundleShow;
  }

  // toggle รายชื่อผู้โดยสารต่อกลุ่ม (ใช้ title เป็น key)
  toggleOutboundGroup(title: string) {
    const key = (title || '').trim();
    const current = this.outboundBundleGroupOpen[key];
    // หากยังไม่เคยมีค่า (undefined) ให้ปิดทันทีในคลิกแรก
    this.outboundBundleGroupOpen[key] = current === undefined ? false : !current;
  }

  toggleInboundGroup(title: string) {
    const key = (title || '').trim();
    const current = this.inboundBundleGroupOpen[key];
    // หากยังไม่เคยมีค่า (undefined) ให้ปิดทันทีในคลิกแรก
    this.inboundBundleGroupOpen[key] = current === undefined ? false : !current;
  }

  // ===== Bundle (FormData) Helpers =====
  private extractPassengerBundlePassengers(direction: 'outbound' | 'inbound'): number[] {
    if (!this.passengers || this.passengers.length === 0) return [];
    const indexes: number[] = [];
    this.passengers.forEach((p: any, idx: number) => {
      if (!p) return;
      const hasBundle = direction === 'outbound'
        ? !!p.outboundBundle
        : !!(p.inboundBundle || p.returnBundle);
      if (hasBundle) indexes.push(idx);
    });
    return indexes;
  }

  // จัดกลุ่ม bundle ของผู้โดยสารตาม title (ใช้ข้อมูลจาก formData)
  private groupPassengerBundlesByTitle(direction: 'outbound' | 'inbound') {
    const indexes = direction === 'outbound' ? this.outboundBundlePassengerIndexes : this.inboundBundlePassengerIndexes;
    const groups = new Map<string, { passengers: Passenger[]; sample: ServiceBundle | null }>();

    indexes.forEach(idx => {
      const p: any = this.passengers[idx];
      const pb = direction === 'outbound'
        ? (p?.outboundBundle as PassengerBundle | null)
        : ((p?.inboundBundle || p?.returnBundle) as PassengerBundle | null);
      if (!pb || !pb.title) return;
      const key = pb.title.trim();
      if (!groups.has(key)) {
        groups.set(key, {
          passengers: [],
          sample: this.convertPassengerBundleToServiceBundle(pb)
        });
      }
      const g = groups.get(key)!;
      g.passengers.push(p);
    });

    const result = Array.from(groups.entries()).map(([title, val]) => ({ title, passengers: val.passengers, sample: val.sample }));
    if (direction === 'outbound') {
      this.outboundBundleGroups = result;
    } else {
      this.inboundBundleGroups = result;
    }
  }

  private convertPassengerBundleToServiceBundle(bundle: PassengerBundle | undefined | null): ServiceBundle | null {
    if (!bundle) return null;
    const firstDetail = bundle.details && bundle.details.length > 0 ? bundle.details[0] : undefined;
    return {
      originalAmount: bundle.original ?? 0,
      discountPercentage: bundle.discount ?? 0,
      includedServices: bundle.details || [],
      promotionalText: '',
      imageUrl: '',
      amount: bundle.price,
      amountIncludingVat: bundle.price,
      categoryId: 0,
      currency: 'THB',
      departureDate: '',
      description: firstDetail?.description || bundle.title,
      flightNumber: bundle.flightNumber || '',
      logicalFlightId: 0,
      paxTypeCode: bundle.paxTypeCode || '',
      physicalFlightId: 0,
      serviceCode: bundle.serviceCode,
      serviceId: 0,
      serviceName: bundle.title,
      vatAmount: 0
    };
  }

  getOutboundBundleFeatures(): string[] {
    const source = this.outboundBundleDisplay;
    if (!source) return [];
    const details = (source.includedServices || []) as PassengerBundleDetail[];
    if (details && details.length > 0) return details.map(d => d.description || d.serviceName);
    if (source.description) return [source.description];
    return [];
  }

  getInboundBundleFeatures(): string[] {
    const source = this.inboundBundleDisplay;
    if (!source) return [];
    const details = (source.includedServices || []) as PassengerBundleDetail[];
    if (details && details.length > 0) return details.map(d => d.description || d.serviceName);
    if (source.description) return [source.description];
    return [];
  }

  getOutboundBundlePassengers(): Passenger[] {
    return this.outboundBundlePassengerIndexes.map(i => this.passengers[i]).filter(Boolean);
  }

  getInboundBundlePassengers(): Passenger[] {
    return this.inboundBundlePassengerIndexes.map(i => this.passengers[i]).filter(Boolean);
  }

  hasOutboundPassengerBundle(): boolean {
    return this.outboundBundlePassengerIndexes.length > 0;
  }

  hasInboundPassengerBundle(): boolean {
    return this.inboundBundlePassengerIndexes.length > 0;
  }

  private updateBundleDisplays() {
    // ค้นหาจากข้อมูลผู้โดยสาร
    this.outboundBundlePassengerIndexes = this.extractPassengerBundlePassengers('outbound');
    this.inboundBundlePassengerIndexes = this.extractPassengerBundlePassengers('inbound');

    const firstOutbound = this.outboundBundlePassengerIndexes.length > 0
      ? (this.passengers[this.outboundBundlePassengerIndexes[0]] as any)?.outboundBundle as PassengerBundle
      : null;
    const firstInbound = this.inboundBundlePassengerIndexes.length > 0
      ? ((this.passengers[this.inboundBundlePassengerIndexes[0]] as any)?.inboundBundle
        || (this.passengers[this.inboundBundlePassengerIndexes[0]] as any)?.returnBundle) as PassengerBundle
      : null;

    const outboundFromPassengers = this.convertPassengerBundleToServiceBundle(firstOutbound);
    const inboundFromPassengers = this.convertPassengerBundleToServiceBundle(firstInbound);

    // หากข้อมูลจาก API ไม่สมบูรณ์ ให้ fallback เป็นข้อมูลจากผู้โดยสาร
    const isValidServiceBundle = (b: ServiceBundle | null): boolean => {
      if (!b) return false;
      const hasName = !!(b.serviceName && b.serviceName.trim() !== '');
      const hasAmount = typeof b.amountIncludingVat === 'number' && b.amountIncludingVat > 0;
      const hasIncluded = Array.isArray(b.includedServices) && b.includedServices.length > 0;
      return hasName || hasAmount || hasIncluded;
    };

    this.outboundBundleDisplay = isValidServiceBundle(this.outboundServiceBundle)
      ? this.outboundServiceBundle
      : outboundFromPassengers;

    this.inboundBundleDisplay = isValidServiceBundle(this.inboundServiceBundle)
      ? this.inboundServiceBundle
      : inboundFromPassengers;

    // จัดกลุ่มตาม title สำหรับการแสดงผลแบบไม่ซ้ำ
    this.groupPassengerBundlesByTitle('outbound');
    this.groupPassengerBundlesByTitle('inbound');
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

  // ตรวจว่ามีข้อมูลเที่ยวบินของทิศทางนั้นจริงหรือไม่
  hasOutboundDirection(): boolean {
    return Array.isArray(this.outboundFlightData) && this.outboundFlightData.length > 0;
  }

  hasInboundDirection(): boolean {
    return Array.isArray(this.inboundFlightData) && this.inboundFlightData.length > 0;
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
    return this.outboundBundleDisplay !== null && 
           this.outboundBundleDisplay.discountPercentage > 0;
  }

  hasInboundDiscount(): boolean {
    return this.inboundBundleDisplay !== null && 
           this.inboundBundleDisplay.discountPercentage > 0;
  }

  // Helper methods สำหรับตรวจสอบ original price
  hasOutboundOriginalPrice(): boolean {
    return this.outboundBundleDisplay !== null && 
           this.outboundBundleDisplay.originalAmount !== this.outboundBundleDisplay.amount;
  }

  hasInboundOriginalPrice(): boolean {
    return this.inboundBundleDisplay !== null && 
           this.inboundBundleDisplay.originalAmount !== this.inboundBundleDisplay.amount;
  }

  // Helper methods สำหรับตรวจสอบ promotional text
  hasOutboundPromotionalText(): boolean {
    return this.outboundBundleDisplay !== null && 
           !!this.outboundBundleDisplay.promotionalText && 
           this.outboundBundleDisplay.promotionalText.trim() !== '';
  }

  hasInboundPromotionalText(): boolean {
    return this.inboundBundleDisplay !== null && 
           !!this.inboundBundleDisplay.promotionalText && 
           this.inboundBundleDisplay.promotionalText.trim() !== '';
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

  // ตรวจสอบว่าเป็นทริปต่างประเทศหรือไม่ (มีอย่างน้อยหนึ่งขาเป็น International)
  isInternationalTrip(): boolean {
    const outboundIntl = Array.isArray(this.outboundFlightData) && this.outboundFlightData.some(f => f.isInternational === true);
    const inboundIntl = Array.isArray(this.inboundFlightData) && this.inboundFlightData.some(f => f.isInternational === true);
    return Boolean(outboundIntl || inboundIntl);
  }

  

  
}
