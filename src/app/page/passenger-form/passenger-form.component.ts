import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith, take, filter } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { ApiService } from '../../core/services/api.service';
import { PassDataService } from '../../core/services/pass-data.service';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
// import { TranslateService } from '@ngx-translate/core';

interface BundleDetail {
  serviceCode: string;
  serviceName: string;
  description: string;
}

interface Bundle {
  icon: string;
  title: string;
  price: number;
  original: number;
  discount?: number;
  serviceCode: string;
  serviceCodeDetail?: string;
  paxTypeCode?: string;
  flightNumber?: string;
  details: BundleDetail[];
}

// อินเตอร์เฟซชุดใหม่ให้ตรงกับโครงสร้าง Service Bundle จาก API
interface BundledServiceItem {
  serviceCode: string;
  serviceName: string;
  description: string;
  currency: string;
  departureDate: string; // ISO string
  flightNumber: string;
  paxTypeCode: string; // e.g., 'Adult' | 'Child'
}

interface ServiceBundle {
  serviceCode: string;
  serviceName: string;
  description: string;
  promotionalText: string;
  imageUrl: string;
  currency: string;
  departureDate: string; // ISO string
  flightNumber: string;
  paxTypeCode: string; // e.g., 'Adult' | 'Child'
  originalAmount: number;
  amount: number;
  vatAmount: number;
  amountIncludingVat: number;
  discountPercentage: number;
  bundledServices: BundledServiceItem[];
}

interface ServiceBundleResponse {
  inbound: ServiceBundle[];
  outbound: ServiceBundle[];
}

interface PassengerData {
  selectedPrefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: Date | null;
  nationality: string;
  country: string;
  passportNumber: string;
  issuedBy: string;
  expireDate: Date | null;
  dialCode?: string;
  phoneNumber?: string;
  email?: string;
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
  outboundBundleIndex?: number | null;
  outboundBundle?: Bundle | null;
  returnBundleIndex?: number | null;
  returnBundle?: Bundle | null;
}

@Component({
  selector: 'app-passenger-form',
  templateUrl: './passenger-form.component.html',
  styleUrls: ['./passenger-form.component.scss']
})
export class PassengerFormComponent {
  // ระบุว่าเที่ยวบินเป็นต่างประเทศหรือไม่ (ใช้กำหนดการแสดง/บังคับฟิลด์พาสปอร์ต)
  isInternationalTrip: boolean = false;
  @ViewChild('passengerScroll', { static: false }) passengerScrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChildren('passengerBox') passengerBoxes?: QueryList<ElementRef<HTMLDivElement>>;

  selectedPassenger = 1;
  numberPassenger = 0;
  numberPassengerArray: number[] = [];
  
  // จำนวนผู้โดยสารที่คาดหวังจาก flight_search
  expectedAdults = 0;
  expectedChildren = 0;
  expectedInfants = 0;
  
  // เก็บข้อมูลผู้โดยสารแต่ละคน
  passengersData: { [key: number]: PassengerData } = {};
  
  // เก็บ FormGroup สำหรับแต่ละผู้โดยสาร
  passengerForms: { [key: number]: FormGroup } = {};

  // FormGroup ปัจจุบัน
  currentForm: FormGroup | null = null;

  prefix = [
    { value: 'MR', label: 'MR' },
    { value: 'MS', label: 'MS' },
    { value: 'MRS', label: 'MRS' },
    { value: 'MONK', label: 'MONK' },
    { value: 'MISS', label: 'MISS' },
  ];

  nationalityOptions: string[] = [];
  countryOptions: string[] = [];
  issuedByOptions: string[] = [];
  dialCodeOptions: any[] = []; // Changed to any[] to accommodate flag, name, idd, displayText
    
  filteredNationalityOptions!: Observable<string[]>;
  filteredCountryOptions!: Observable<string[]>;
  filteredIssuedByOptions!: Observable<string[]>;
  filteredDialCodeOptions!: Observable<any[]>;

  // เก็บผลกรองล่าสุดไว้ใช้ตอน blur
  lastFilteredNationalityOptions: string[] = [];
  lastFilteredCountryOptions: string[] = [];
  lastFilteredIssuedByOptions: string[] = [];
  lastFilteredDialCodeOptions: any[] = [];

  isLoading = false;

  // เก็บเที่ยวบินขาไป/ขากลับ เพื่อใช้เช็คการมีอยู่ของแต่ละขา
  outboundFlightData: any[] = [];
  inboundFlightData: any[] = [];

  // ลบ state ระดับคอมโพเนนต์สำหรับ Special Assistance ออก เพื่อใช้ค่าจากฟอร์มแทน

  // Bundle UI data
  outboundBundles: Bundle[] = [
    { icon: 'seat', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'bag', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'bag', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'hand', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'vip', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
  ];

  returnBundles: Bundle[] = [
    { icon: 'seat', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'bag', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'bag', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'hand', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
    { icon: 'vip', title: 'xxx', price: 0, original: 0, discount: 0, serviceCode: 'xxx', details: [
      { serviceCode: '', serviceName: '', description: 'xxx' },
      { serviceCode: '', serviceName: '', description: 'xxx' }
    ] },
  ];

  // สถานะการแสดงผล bundle (แสดง 4 ก่อน ถ้าเกินค่อยกดดูเพิ่มเติม)
  showAllOutboundBundles = false;
  showAllReturnBundles = false;
  private serviceBundleRaw: ServiceBundleResponse | null = null;

  get currentOutboundBundleList(): Bundle[] {
    return this.getBundlesForPassenger(this.selectedPassenger, 'outbound');
  }

  get visibleOutboundBundles(): Bundle[] {
    const list = this.currentOutboundBundleList;
    return this.showAllOutboundBundles ? list : list.slice(0, 3);
  }

  get currentReturnBundleList(): Bundle[] {
    return this.getBundlesForPassenger(this.selectedPassenger, 'inbound');
  }

  get visibleReturnBundles(): Bundle[] {
    const list = this.currentReturnBundleList;
    return this.showAllReturnBundles ? list : list.slice(0, 3);
  }

  toggleShowAllOutbound() {
    this.showAllOutboundBundles = !this.showAllOutboundBundles;
  }

  toggleShowAllReturn() {
    this.showAllReturnBundles = !this.showAllReturnBundles;
  }

  get canShowBundles(): boolean {
    return this.getPassengerPaxType(this.selectedPassenger) !== null;
  }

  private getPassengerAge(passengerNumber: number): number | null {
    const form = this.passengerForms[passengerNumber];
    const value = form?.get('birthDate')?.value;
    if (!value) return null;
    const birth = new Date(value);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private getPassengerPaxType(passengerNumber: number): 'Adult' | 'Child' | null {
    const age = this.getPassengerAge(passengerNumber);
    if (age === null) return null;
    // ทารก (< 2 ปี) ไม่สามารถเลือก/แสดง bundle
    if (age < 2) return null;
    if (age <= 12) return 'Child';
    return 'Adult';
  }

  // จัดประเภท pax จากอายุ (เพิ่ม Infant)
  private getPaxTypeByAge(age: number | null): 'Adult' | 'Child' | 'Infant' | null {
    if (age === null) return null;
    if (age < 2) return 'Infant';
    if (age <= 12) return 'Child';
    return 'Adult';
  }

  // นับจำนวน Adult/Child/Infant จากฟอร์มปัจจุบัน
  private countPaxFromForms(): { adults: number; children: number; infants: number } {
    let adults = 0;
    let children = 0;
    let infants = 0;
    for (const passengerNumber of this.numberPassengerArray) {
      const age = this.getPassengerAge(passengerNumber);
      const paxType = this.getPaxTypeByAge(age);
      if (paxType === 'Adult') adults++;
      else if (paxType === 'Child') children++;
      else if (paxType === 'Infant') infants++;
    }
    return { adults, children, infants };
  }

  // ตรวจสอบจำนวนตาม expected
  private isPaxCountsMatchingExpected(): boolean {
    const { adults, children, infants } = this.countPaxFromForms();
    return adults === this.expectedAdults && children === this.expectedChildren && infants === this.expectedInfants;
  }

  private mapToBundle(item: ServiceBundle): Bundle {
    return {
      icon: 'seat',
      title: item.serviceName,
      price: item.amount,
      original: item.originalAmount,
      discount: item.discountPercentage,
      serviceCode: item.serviceCode,
      serviceCodeDetail: item.serviceCode,
      paxTypeCode: item.paxTypeCode,
      flightNumber: item.flightNumber,
      details: (item.bundledServices || []).map((service) => ({
        serviceCode: service.serviceCode,
        serviceName: service.serviceName,
        description: service.description
      }))
    };
  }

  private getBundlesForPassenger(passengerNumber: number, direction: 'outbound' | 'inbound'): Bundle[] {
    if (!this.serviceBundleRaw) return [];
    const paxType = this.getPassengerPaxType(passengerNumber);
    if (!paxType) return [];
    const source = direction === 'outbound' ? this.serviceBundleRaw.outbound : this.serviceBundleRaw.inbound;
    return (source || [])
      .filter(item => (item.paxTypeCode || '').toLowerCase() === paxType.toLowerCase())
      .map(item => this.mapToBundle(item));
  }


  // สถานะการเลือก bundle ต่อผู้โดยสาร
  // เปิด/ปิดรายละเอียด (accordion) ต่อผู้โดยสาร
  selectedOutboundBundleIndexByPassenger: { [passenger: number]: number | null } = {};
  selectedReturnBundleIndexByPassenger: { [passenger: number]: number | null } = {};

  // เก็บค่าที่เลือกจริงของ bundle ต่อผู้โดยสาร (อาจซ้ำกับที่เปิดดู)
  selectedOutboundBundleByPassenger: { [passenger: number]: number | null } = {};
  selectedReturnBundleByPassenger: { [passenger: number]: number | null } = {};

  selectOutboundBundle(index: number) {
    const p = this.selectedPassenger;
    const currentSelected = this.selectedOutboundBundleByPassenger[p] ?? null;
    if (currentSelected === index) {
      // คลิกซ้ำ -> ยกเลิกการเลือก และปิดรายละเอียด
      this.selectedOutboundBundleByPassenger[p] = null;
      this.selectedOutboundBundleIndexByPassenger[p] = null;
      this.ensurePassengerDataExists(p);
      (this.passengersData[p] as any).outboundBundleIndex = null;
      (this.passengersData[p] as any).outboundBundle = null;
    } else {
      // เลือกรายการใหม่ -> เปิดรายละเอียดของรายการนั้น
      this.selectedOutboundBundleByPassenger[p] = index;
      this.selectedOutboundBundleIndexByPassenger[p] = index;
      this.ensurePassengerDataExists(p);
      (this.passengersData[p] as any).outboundBundleIndex = index;
      const list = this.getBundlesForPassenger(p, 'outbound');
      (this.passengersData[p] as any).outboundBundle = list[index] ?? null;
    }
  }

  selectReturnBundle(index: number) {
    const p = this.selectedPassenger;
    const currentSelected = this.selectedReturnBundleByPassenger[p] ?? null;
    if (currentSelected === index) {
      // คลิกซ้ำ -> ยกเลิกการเลือก และปิดรายละเอียด
      this.selectedReturnBundleByPassenger[p] = null;
      this.selectedReturnBundleIndexByPassenger[p] = null;
      this.ensurePassengerDataExists(p);
      (this.passengersData[p] as any).returnBundleIndex = null;
      (this.passengersData[p] as any).returnBundle = null;
    } else {
      // เลือกรายการใหม่ -> เปิดรายละเอียดของรายการนั้น
      this.selectedReturnBundleByPassenger[p] = index;
      this.selectedReturnBundleIndexByPassenger[p] = index;
      this.ensurePassengerDataExists(p);
      (this.passengersData[p] as any).returnBundleIndex = index;
      const list = this.getBundlesForPassenger(p, 'inbound');
      (this.passengersData[p] as any).returnBundle = list[index] ?? null;
    }
  }

  // proxy ตัวแปรให้ HTML ใช้งานต่อผู้โดยสารที่เลือกอยู่
  get selectedOutboundBundleIndex(): number | null {
    return this.selectedOutboundBundleIndexByPassenger[this.selectedPassenger] ?? null;
  }
  set selectedOutboundBundleIndex(val: number | null) {
    this.selectedOutboundBundleIndexByPassenger[this.selectedPassenger] = val;
  }
  get selectedReturnBundleIndex(): number | null {
    return this.selectedReturnBundleIndexByPassenger[this.selectedPassenger] ?? null;
  }
  set selectedReturnBundleIndex(val: number | null) {
    this.selectedReturnBundleIndexByPassenger[this.selectedPassenger] = val;
  }

  private ensurePassengerDataExists(p: number) {
    if (!this.passengersData[p]) {
      this.passengersData[p] = this.passengerForms[p]?.value ?? {} as any;
    }
  }

  constructor(private router: Router, 
    private dialog: MatDialog, 
    private route: ActivatedRoute,
    private apiService: ApiService, 
    private passDataService: PassDataService) {
      this.route.queryParams.subscribe((params: any) => {
        const idx = Number(params?.passengerIndex);
        if (!isNaN(idx)) {
          this.selectedPassenger = idx;
        }
      });
    }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.isLoading = true;
    // ตั้งค่าเริ่มต้นก่อน
    this.passDataService.getPassengerInfo().subscribe((data: any) => {
      // คำนวณสถานะไฟลท์ในประเทศ/ต่างประเทศ จากข้อมูลเที่ยวบินที่เลือก
      try {
        const outboundIntl = data?.outbound_flight_select?.flight_detail?.some((f: any) => f?.isInternational === true) === true;
        const inboundIntl = data?.inbound_flight_select?.flight_detail?.some((f: any) => f?.isInternational === true) === true;
        this.isInternationalTrip = outboundIntl || inboundIntl;
      } catch (_) {
        this.isInternationalTrip = false;
      }

    // กำหนดข้อมูลเที่ยวบินขาไป/ขากลับจาก passenger info
    const outboundFlights = Array.isArray(data?.outbound_flight_select?.flight_detail)
      ? data.outbound_flight_select.flight_detail
      : [];
    const inboundFlights = Array.isArray(data?.inbound_flight_select?.flight_detail)
      ? data.inbound_flight_select.flight_detail
      : [];
    this.outboundFlightData = outboundFlights;
    this.inboundFlightData = inboundFlights;
      const adults = data?.flight_search?.adults ?? 0;
      const children = data?.flight_search?.children ?? 0;
      const infants = data?.flight_search?.infants ?? 0;
      // เก็บ expected count
      this.expectedAdults = Number(adults);
      this.expectedChildren = Number(children);
      this.expectedInfants = Number(infants);
      this.numberPassenger = Number(adults) + Number(children) + Number(infants);
      if (this.numberPassenger <= 0) {
        this.numberPassenger = 1;
      }
      this.numberPassengerArray = Array.from({length: this.numberPassenger}, (_, i) => i + 1);
      this.initializePassengerForms();
      
      // ตั้งค่า currentForm หลังจาก initializePassengerForms
      if (this.numberPassenger > 0) {
        const fallbackPassenger = 1;
        const selected = Number(this.selectedPassenger);
        const validSelected = !isNaN(selected) && selected >= 1 && selected <= this.numberPassenger ? selected : fallbackPassenger;
        this.selectedPassenger = validSelected;
        this.currentForm = this.passengerForms[this.selectedPassenger];
        this.setupAutocompleteFilters();
      }
    });

    this.passDataService.getUserId().pipe(take(1)).subscribe((userId: string) => {
      if (!userId) {
        return;
      }

      const language$ = this.passDataService.getLanguage().pipe(take(1));
      const passengerInfo$ = this.passDataService
        .getPassengerInfo()
        .pipe(
          filter((info: any) => !!info && !!info.flight_search),
          take(1)
        );

      combineLatest([language$, passengerInfo$]).subscribe(([language, passengerInfo]: [string, any]) => {
        const currency = passengerInfo?.flight_search?.currency;
        if (!currency) {
          return;
        }
        this.apiService.getServiceBundle(userId, language, currency).subscribe((data: any) => {
          this.convertServiceBundle(data);
          this.isLoading = false;
        });
      });
    });

    // โหลดข้อมูลจาก service และโหลดข้อมูลเพียงครั้งเดียว
    this.passDataService.getFormData().subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        // มีข้อมูลจาก service - อัปเดตและโหลด
        this.passengersData = data;
        this.numberPassenger = Object.keys(this.passengersData).length;
        this.numberPassengerArray = Array.from({length: this.numberPassenger}, (_, i) => i + 1);
        this.initializePassengerForms();
        this.loadAllPassengerData(this.passengersData);
      } else {
        // ไม่มีข้อมูลจาก service - โหลดข้อมูลเริ่มต้น
        this.loadAllPassengerData(this.passengersData);
      }
    });

    // โหลดข้อมูลประเทศ
    this.apiService.getRestcountries().subscribe((res: any) => {
      this.convertRestcountries(res);
    });
  }

  // switchLanguage(lang: 'th' | 'en') {
  //   this.translate.use(lang);
  // }

  convertRestcountries(res: any) {
    let _data: any[] = [];
    for (let i = 0; i < res.length; i++) {
      const country = res[i];
      const root = country.idd.root;
      const suffixes = country.idd.suffixes || [];
      
      const allDialCodes: string[] = [];
      
      if (country.cca2 === 'US') {
        allDialCodes.push(root);
      } else {
        suffixes.forEach((suffix: string) => {
          allDialCodes.push(root + suffix);
        });
        
        if (suffixes.length === 0) {
          allDialCodes.push(root);
        }
      }
      
      allDialCodes.forEach(dialCode => {
        _data.push({
          flag: country.flags.png,
          name: country.name.common,
          idd: dialCode,
          displayText: `${country.name.common} (${dialCode})`
        });
      });
    }

    this.countryOptions = res.map((item: any) => item.name.common);
    this.issuedByOptions = res.map((item: any) => item.name.common);
    this.nationalityOptions = res.map((item: any) => item.name.common);
    
    this.dialCodeOptions = _data;

    this.revalidateOptionControls();

    // ตั้งค่า default สำหรับทริปในประเทศ: สัญชาติไทย และ dial code +66
    if (!this.isInternationalTrip) {
      Object.values(this.passengerForms).forEach((form: FormGroup) => {
        const nat = form?.get('nationality');
        if (nat && !nat.value) {
          const thName = 'Thailand';
          if (this.nationalityOptions.includes(thName)) {
            nat.setValue(thName, { emitEvent: false });
          }
        }
      });
      // ตั้ง dial code เริ่มต้นเป็น +66 สำหรับผู้โดยสารคนที่ 1 หากยังว่าง
      const form1 = this.passengerForms[1];
      const dc = form1?.get('dialCode');
      if (dc && !dc.value) {
        dc.setValue('+66', { emitEvent: false });
      }
    }
  }

  extractDialCode(option: any): string {
    if (typeof option === 'string') {
      const colonIndex = option.indexOf(': ');
      if (colonIndex !== -1) {
        return option.substring(colonIndex + 2);
      }
      return option;
    }
    return option.idd;
  }

  getDisplayText(option: any): string {
    if (typeof option === 'string') {
      const colonIndex = option.indexOf(': ');
      if (colonIndex !== -1) {
        return option.substring(0, colonIndex);
      }
      return option;
    }
    return option.displayText;
  }

  getFlagUrl(option: any): string {
    if (typeof option === 'string') {
      const parts = option.split(': ');
      if (parts.length >= 3) {
        return parts[0]; // flag URL
      }
      return '';
    }
    return option.flag;
  }

  private getDialCodeByCountryName(countryName: string): string | null {
    if (!countryName) return null;
    const lower = countryName.toLowerCase();
    const matches = (this.dialCodeOptions || []).filter((opt: any) => {
      if (typeof opt === 'string') return false;
      return (opt.name || '').toLowerCase() === lower;
    });
    if (matches.length === 0) return null;
    const best = matches.reduce((prev: any, curr: any) => {
      const prevLen = (this.extractDialCode(prev) || '').length;
      const currLen = (this.extractDialCode(curr) || '').length;
      return currLen < prevLen ? curr : prev;
    });
    return this.extractDialCode(best) || null;
  }

  // ผูกการเปลี่ยนแปลงของสัญชาติเพื่ออัปเดต dial code อัตโนมัติ (เฉพาะผู้โดยสารคนที่ 1 ที่มี dialCode)
  private subscribeNationalityToDialCode(form: FormGroup) {
    const nationalityControl = form.get('nationality');
    const dialCodeControl = form.get('dialCode');
    if (!nationalityControl || !dialCodeControl) return;

    const initialNat = (nationalityControl.value ?? '').toString();
    const initialDial = this.getDialCodeByCountryName(initialNat);
    if (initialDial && !dialCodeControl.value) {
      dialCodeControl.setValue(initialDial, { emitEvent: false });
    }

    nationalityControl.valueChanges.subscribe((val: string) => {
      const code = this.getDialCodeByCountryName((val ?? '').toString());
      if (code) {
        dialCodeControl.setValue(code, { emitEvent: false });
      }
    });
  }

  // สร้าง FormGroup สำหรับผู้โดยสารแต่ละคน
  private initializePassengerForms() {
    if (!this.numberPassengerArray || this.numberPassengerArray.length === 0) {
      this.numberPassenger = Math.max(1, Number(this.numberPassenger) || 0);
      this.numberPassengerArray = Array.from({ length: this.numberPassenger }, (_, i) => i + 1);
    }
    
    for (const passengerNumber of this.numberPassengerArray) {
      if (passengerNumber === 1) {
        // ฟิลด์พาสปอร์ตบังคับเฉพาะทริปต่างประเทศ
        const passportValidators = this.isInternationalTrip ? [Validators.required] : [];
        const passportDateValidators = this.isInternationalTrip ? [Validators.required, this.notPastDateValidator()] : [];

        // สร้าง validators แบบมีเงื่อนไขสำหรับสัญชาติและประเทศ
        const nationalityValidators = this.isInternationalTrip
          ? [Validators.required, this.optionExistsValidator(() => this.nationalityOptions)]
          : [this.optionExistsValidator(() => this.nationalityOptions)];
        const countryValidators = this.isInternationalTrip
          ? [Validators.required, this.optionExistsValidator(() => this.countryOptions)]
          : [this.optionExistsValidator(() => this.countryOptions)];

        this.passengerForms[passengerNumber] = new FormGroup({
          selectedPrefix: new FormControl('', [Validators.required]),
          firstName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          middleName: new FormControl('', [Validators.pattern(/^[a-zA-Z\s]+$/)]),
          lastName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          birthDate: new FormControl(null, [Validators.required, this.minAgeValidator(12)]),
          nationality: new FormControl('', nationalityValidators),
          country: new FormControl('', countryValidators),
          passportNumber: new FormControl('', passportValidators),
          issuedBy: new FormControl('', [
            ...passportValidators,
            // Validators.pattern(/^[a-zA-Z\s]+$/),
            this.optionExistsValidator(() => this.issuedByOptions)
          ]),
          expireDate: new FormControl(null, passportDateValidators),
          dialCode: new FormControl('', [this.dialCodeExistsValidator()]),
          phoneNumber: new FormControl('', [Validators.required]),
          email: new FormControl('', [Validators.required, Validators.email]),
          needsSpecialAssistance: new FormControl(false),
          disabledVision: new FormControl(false),
          disabledHearing: new FormControl(false),
          monk: new FormControl(false),
          nun: new FormControl(false),
          pregnantWoman: new FormControl(false),
          wheelchairUser: new FormControl(false),
          unaccompaniedMinor: new FormControl(false),
          other: new FormControl(false),
          otherReason: new FormControl('')
        });
        // ผูกตัวตรวจสอบเบอร์โทรตาม dial code และอัปเดตเมื่อเปลี่ยนรหัสประเทศ (เฉพาะผู้โดยสารคนที่ 1)
        const dialCtrl = this.passengerForms[passengerNumber].get('dialCode');
        const phoneCtrl = this.passengerForms[passengerNumber].get('phoneNumber');
        if (dialCtrl && phoneCtrl) {
          phoneCtrl.setValidators([
            Validators.required,
            this.phoneNumberByDialCodeValidator(() => {
              const raw = dialCtrl.value;
              return typeof raw === 'string' ? raw : this.extractDialCode(raw);
            })
          ]);
          phoneCtrl.updateValueAndValidity({ emitEvent: false });
          dialCtrl.valueChanges.subscribe(() => {
            phoneCtrl.updateValueAndValidity({ emitEvent: false });
          });
        }
        // พรีโหลดข้อมูลจาก service ถ้ามี เพื่อให้ฟอร์ม valid ตั้งแต่เริ่มต้น
        const prefill = (this.passengersData && this.passengersData[passengerNumber]) ? this.passengersData[passengerNumber] : null;
        if (prefill) {
          this.passengerForms[passengerNumber].patchValue(prefill);
          this.normalizeDialCodeValue(this.passengerForms[passengerNumber]);
        }
        // ผูกสัญชาติกับ dial code อัตโนมัติสำหรับผู้โดยสารคนที่ 1
        this.subscribeNationalityToDialCode(this.passengerForms[passengerNumber]);
        // ผูกการสลับ validators ตามอายุ (Infant ไม่ตรวจพาสปอร์ต)
        this.bindInfantPassportValidators(passengerNumber);
      } else {
        // ผู้โดยสารคนที่ 2+ - ไม่ต้องกรอก contact (ไม่มี FormControl สำหรับ contact)
        const passportValidators = this.isInternationalTrip ? [Validators.required] : [];
        const passportDateValidators = this.isInternationalTrip ? [Validators.required, this.notPastDateValidator()] : [];
        const nationalityValidators = this.isInternationalTrip
          ? [Validators.required, this.optionExistsValidator(() => this.nationalityOptions)]
          : [this.optionExistsValidator(() => this.nationalityOptions)];
        const countryValidators = this.isInternationalTrip
          ? [Validators.required, this.optionExistsValidator(() => this.countryOptions)]
          : [this.optionExistsValidator(() => this.countryOptions)];

        this.passengerForms[passengerNumber] = new FormGroup({
          selectedPrefix: new FormControl('', [Validators.required]),
          firstName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          middleName: new FormControl('', [Validators.pattern(/^[a-zA-Z\s]+$/)]),
          lastName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          birthDate: new FormControl(null, [Validators.required]),
          nationality: new FormControl('', nationalityValidators),
          country: new FormControl('', countryValidators),
          passportNumber: new FormControl('', passportValidators),
          issuedBy: new FormControl('', [
            ...passportValidators,
            // Validators.pattern(/^[a-zA-Z\s]+$/),
            this.optionExistsValidator(() => this.issuedByOptions)
          ]),
          expireDate: new FormControl(null, passportDateValidators),
          needsSpecialAssistance: new FormControl(false),
          disabledVision: new FormControl(false),
          disabledHearing: new FormControl(false),
          monk: new FormControl(false),
          nun: new FormControl(false),
          pregnantWoman: new FormControl(false),
          // ไม่มี phonePrefix, phoneNumber, email สำหรับผู้โดยสารคนที่ 2+
          wheelchairUser: new FormControl(false),
          unaccompaniedMinor: new FormControl(false),
          other: new FormControl(false),
          otherReason: new FormControl('')
        });
        // พรีโหลดข้อมูลจาก service ถ้ามี เพื่อให้ฟอร์ม valid ตั้งแต่เริ่มต้น
        const prefill = (this.passengersData && this.passengersData[passengerNumber]) ? this.passengersData[passengerNumber] : null;
        if (prefill) {
          this.passengerForms[passengerNumber].patchValue(prefill);
          this.normalizeDialCodeValue(this.passengerForms[passengerNumber]);
        }
        // ผูกการสลับ validators ตามอายุ (Infant ไม่ตรวจพาสปอร์ต)
        this.bindInfantPassportValidators(passengerNumber);
      }
    }
    

  }

  // สลับ validators ของฟิลด์พาสปอร์ตตามอายุ: หากอายุน้อยกว่า 2 ปี (Infant) จะยกเลิกการตรวจพาสปอร์ต
  private bindInfantPassportValidators(passengerNumber: number) {
    const form = this.passengerForms[passengerNumber];
    if (!form) return;

    const apply = () => {
      const age = this.getPassengerAge(passengerNumber);
      const isInfant = age !== null && age < 2;

      // คำนวณว่าอายุน้อยกว่า 2 สัปดาห์หรือไม่ (นับเป็นจำนวนวัน)
      const birthRaw = form.get('birthDate')?.value;
      let isUnderTwoWeeks = false;
      if (birthRaw) {
        const birthDate = new Date(birthRaw);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          birthDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
          isUnderTwoWeeks = diffDays >= 0 && diffDays < 14;
        }
      }

      const passportNumber = form.get('passportNumber');
      const issuedBy = form.get('issuedBy');
      const expireDate = form.get('expireDate');
      const nationality = form.get('nationality');
      const country = form.get('country');


      // - หากเป็น Infant แต่มีอายุน้อยกว่า 2 สัปดาห์ ให้บังคับด้วย
      const requirePassport = this.isInternationalTrip && (!isInfant || isUnderTwoWeeks);

      if (passportNumber) {
        passportNumber.setValidators(requirePassport ? [Validators.required] : []);
        passportNumber.updateValueAndValidity({ emitEvent: false });
      }
      if (issuedBy) {
        const baseIssuedBy = [this.optionExistsValidator(() => this.issuedByOptions)];
        issuedBy.setValidators(requirePassport ? [Validators.required, ...baseIssuedBy] : baseIssuedBy);
        issuedBy.updateValueAndValidity({ emitEvent: false });
      }
      if (expireDate) {
        expireDate.setValidators(requirePassport ? [Validators.required, this.notPastDateValidator()] : []);
        expireDate.updateValueAndValidity({ emitEvent: false });
      }

      // - หากเป็น Infant แต่มีอายุน้อยกว่า 2 สัปดาห์ ให้บังคับด้วย
      const requireDemographic = this.isInternationalTrip && (!isInfant || isUnderTwoWeeks);
      if (nationality) {
        nationality.setValidators(requireDemographic ? [Validators.required, this.optionExistsValidator(() => this.nationalityOptions)] : []);
        nationality.updateValueAndValidity({ emitEvent: false });
      }
      if (country) {
        country.setValidators(requireDemographic ? [Validators.required, this.optionExistsValidator(() => this.countryOptions)] : []);
        country.updateValueAndValidity({ emitEvent: false });
      }
    };

    // apply ครั้งแรกหลังสร้างฟอร์ม/โหลดค่า
    apply();

    // ผูกกับการเปลี่ยนแปลงวันเกิดเพื่อสลับ validators อัตโนมัติ
    const birth = form.get('birthDate');
    birth?.valueChanges.subscribe(() => apply());
  }

  // ตั้งค่า autocomplete filters
  private setupAutocompleteFilters() {
    if (!this.currentForm) return;

    this.filteredNationalityOptions = this.currentForm.get('nationality')!.valueChanges.pipe(
      startWith(''),
      map((curr) => {
        const currStr = (curr ?? '').toString();
        const options = this._filterNationality(currStr);
        this.lastFilteredNationalityOptions = options;
        return options;
      })
    );

    this.filteredCountryOptions = this.currentForm.get('country')!.valueChanges.pipe(
      startWith(''),
      map((curr) => {
        const currStr = (curr ?? '').toString();
        const options = this._filterCountry(currStr);
        this.lastFilteredCountryOptions = options;
        return options;
      })
    );

    this.filteredIssuedByOptions = this.currentForm.get('issuedBy')!.valueChanges.pipe(
      startWith(''),
      map((curr) => {
        const currStr = (curr ?? '').toString();
        const options = this._filterIssuedBy(currStr);
        this.lastFilteredIssuedByOptions = options;
        return options;
      })
    );

    // เฉพาะผู้โดยสารคนที่ 1 เท่านั้นที่มี dialCode
    if (this.selectedPassenger === 1) {
      this.filteredDialCodeOptions = this.currentForm.get('dialCode')!.valueChanges.pipe(
        startWith(''),
        map((curr) => {
          const currStr = typeof curr === 'string' ? curr : '';
          const options = this._filterDialCode(currStr);
          this.lastFilteredDialCodeOptions = options;
          return options;
        })
      );
    }
  }

  private _filterNationality(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.nationalityOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterCountry(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countryOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterIssuedBy(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.issuedByOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterDialCode(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.dialCodeOptions.filter(option => {
      if (typeof option === 'string') {
        return option.toLowerCase().includes(filterValue);
      }
      return option.name.toLowerCase().includes(filterValue) || 
             option.idd.toLowerCase().includes(filterValue);
    });
  }

  private optionExistsValidator(getOptions: () => string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value ?? '').toString().trim();
      if (value === '') return null;
      const options = getOptions() || [];
      // ถ้ายังไม่ได้โหลดตัวเลือก ให้ถือว่าผ่านไปก่อนเพื่อไม่ให้ฟอร์ม invalid โดยไม่จำเป็น
      if (options.length === 0) return null;
      const exists = options.some(opt => opt.toLowerCase() === value.toLowerCase());
      return exists ? null : { notFound: true };
    };
  }

  private dialCodeExistsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value;
      const value = typeof raw === 'string' ? raw.trim() : this.extractDialCode(raw);
      if (!value) return null;
      const options = this.dialCodeOptions || [];
      if (options.length === 0) return null; // ปล่อยผ่านก่อนถ้ายังไม่โหลดตัวเลือก
      const exists = options.some(opt => {
        if (typeof opt === 'string') return opt === value;
        return this.extractDialCode(opt) === value;
      });
      return exists ? null : { notFound: true };
    };
  }

  private normalizeDialCodeValue(form: FormGroup) {
    const c = form.get('dialCode');
    if (!c) return;
    const raw = c.value;
    if (raw && typeof raw !== 'string') {
      const normalized = this.extractDialCode(raw);
      c.setValue(normalized, { emitEvent: false });
    }
  }

  private revalidateOptionControls() {
    Object.values(this.passengerForms).forEach(form => {
      if (!form) return;
      ['nationality', 'country', 'issuedBy', 'dialCode'].forEach(name => {
        const c = form.get(name);
        if (c) c.updateValueAndValidity({ onlySelf: true });
      });
    });
  }

  // บันทึกข้อมูลผู้โดยสารปัจจุบัน
  private saveCurrentPassengerData() {

    if (!this.currentForm) return;
    const p = this.selectedPassenger;
    const existing: any = this.passengersData[p] || {};
    const merged: any = { ...existing, ...this.currentForm.value };
    const outboundIndex = this.selectedOutboundBundleByPassenger[p];
    if (outboundIndex !== undefined) {
      merged.outboundBundleIndex = outboundIndex ?? null;
      const list = this.getBundlesForPassenger(p, 'outbound');
      merged.outboundBundle = typeof outboundIndex === 'number' ? (list[outboundIndex] ?? null) : null;
    }
    const returnIndex = this.selectedReturnBundleByPassenger[p];
    if (returnIndex !== undefined) {
      merged.returnBundleIndex = returnIndex ?? null;
      const listRet = this.getBundlesForPassenger(p, 'inbound');
      merged.returnBundle = typeof returnIndex === 'number' ? (listRet[returnIndex] ?? null) : null;
    }
    this.passengersData[p] = merged;
  }

  // โหลดข้อมูลผู้โดยสาร
  private loadPassengerData(passengerNumber: number) {
    // อัปเดต FormGroup ปัจจุบัน
    this.currentForm = this.passengerForms[passengerNumber];
    
    if (!this.currentForm) {
      return;
    }
    
    const data = this.passengersData[passengerNumber];
    if (data) {
      this.currentForm.patchValue(data);
      this.normalizeDialCodeValue(this.currentForm);
    }

    // อัปเดต autocomplete filters สำหรับ FormGroup ใหม่
    this.setupAutocompleteFilters();
  }

  // เพิ่มฟังก์ชันใหม่สำหรับโหลดข้อมูลผู้โดยสารทุกคน
  private loadAllPassengerData(data: any) {
    // โหลดข้อมูลผู้โดยสารทุกคน
    for (const passengerNumber of this.numberPassengerArray) {
      const _data = data[passengerNumber];
      if (_data && this.passengerForms[passengerNumber]) {
        this.passengerForms[passengerNumber].patchValue(_data);
      }
      // กู้คืนตัวเลือก bundle ถ้ามี
      if (_data && typeof _data.outboundBundleIndex !== 'undefined') {
        this.selectedOutboundBundleByPassenger[passengerNumber] = _data.outboundBundleIndex;
        this.selectedOutboundBundleIndexByPassenger[passengerNumber] = _data.outboundBundleIndex ?? null;
        // ทำให้แน่ใจว่า passengersData มี object ของ bundle ด้วย
        if (!this.passengersData[passengerNumber]) {
          this.passengersData[passengerNumber] = {} as any;
        }
        const list = this.getBundlesForPassenger(passengerNumber, 'outbound');
        (this.passengersData[passengerNumber] as any).outboundBundle = _data.outboundBundleIndex != null ? (list[_data.outboundBundleIndex] ?? null) : null;
      }
      if (_data && typeof _data.returnBundleIndex !== 'undefined') {
        this.selectedReturnBundleByPassenger[passengerNumber] = _data.returnBundleIndex;
        this.selectedReturnBundleIndexByPassenger[passengerNumber] = _data.returnBundleIndex ?? null;
        if (!this.passengersData[passengerNumber]) {
          this.passengersData[passengerNumber] = {} as any;
        }
        const listRet = this.getBundlesForPassenger(passengerNumber, 'inbound');
        (this.passengersData[passengerNumber] as any).returnBundle = _data.returnBundleIndex != null ? (listRet[_data.returnBundleIndex] ?? null) : null;
      }
    }
    
    const fallbackPassenger = 1;
    const selected = Number(this.selectedPassenger);
    const validSelected = !isNaN(selected) && selected >= 1 && selected <= this.numberPassenger ? selected : fallbackPassenger;
    this.selectedPassenger = validSelected;
    this.currentForm = this.passengerForms[this.selectedPassenger];
    
    // ตรวจสอบว่า currentForm มีค่าหรือไม่
    if (!this.currentForm) {
      return;
    }
    
    // อัปเดต autocomplete filters
    this.setupAutocompleteFilters();
  }


  isAllPassengersValid(): boolean {
    return this.numberPassengerArray.every(passengerNumber => {
      const form = this.passengerForms[passengerNumber];
      return form && form.valid;
    });
  }

  getFirstInvalidPassenger(): number {
    for (const passengerNumber of this.numberPassengerArray) {
      const form = this.passengerForms[passengerNumber];
      if (!form || form.invalid) {
        return passengerNumber;
      }
    }
    return this.numberPassenger + 1;
  }

  canSelectPassenger(passenger: number): boolean {
    if (this.isAllPassengersValid()) return true;
    const firstInvalid = this.getFirstInvalidPassenger();
    // อนุญาตให้เลือกได้ตั้งแต่คนแรกจนถึงคนที่ยังไม่ครบ (ย้อนกลับได้ แต่ห้ามข้ามไปข้างหน้า)
    return passenger <= firstInvalid;
  }

  selectPassenger(passenger: number) {
    // บันทึกข้อมูลผู้โดยสารปัจจุบันก่อนเปลี่ยน 
    this.saveCurrentPassengerData();

    // ป้องกันการเลือกผู้โดยสารที่ยังไม่ถึงคิว
    if (!this.canSelectPassenger(passenger)) {
      return;
    }
    
    // เปลี่ยนไปยังผู้โดยสารที่เลือก
    this.selectedPassenger = passenger;
    
    // โหลดข้อมูลผู้โดยสารที่เลือก
    this.loadPassengerData(passenger);

    // เลื่อนไปยังกล่องผู้โดยสารที่เลือก
    this.scrollSelectedPassengerIntoView();
  }

  nextPassenger() {
    this.saveCurrentPassengerData();
    if (this.selectedPassenger < this.numberPassenger) {
      this.selectedPassenger++;
      this.loadPassengerData(this.selectedPassenger);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.scrollSelectedPassengerIntoView();
  }

  // scroll to first error
  scrollToFirstError() {
    const attemptScroll = () => {
      const formElement = document.querySelector('form');
      if (!formElement) return;

      // หา control ที่ invalid ตัวแรกภายใต้ฟอร์ม
      const invalidControl = formElement.querySelector(
        'input.ng-invalid, textarea.ng-invalid, mat-select.ng-invalid'
      ) as HTMLElement | null;

      if (invalidControl) {
        const container = invalidControl.closest('mat-form-field') ?? invalidControl;
        (container as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof (invalidControl as any).focus === 'function') {
          (invalidControl as HTMLElement).focus();
        }
      }
    };

    // รอให้ Angular render error state เสร็จก่อนค่อยเลื่อน
    setTimeout(() => {
      attemptScroll();
      // เผื่อกรณี DOM ยังอัปเดตไม่สมบูรณ์ ลองอีกครั้งสั้นๆ
      setTimeout(() => attemptScroll(), 120);
    }, 0);
  }

  // scroll selected passenger chip into view
  private scrollSelectedPassengerIntoView() {
    // หน่วงให้ Angular อัปเดต DOM เสร็จก่อน
    setTimeout(() => {
      const targetIndex = this.selectedPassenger - 1;
      const container = this.passengerScrollContainer?.nativeElement;
      const boxes = this.passengerBoxes?.toArray().map(r => r.nativeElement) ?? [];
      if (!container || !boxes[targetIndex]) return;

      const targetEl = boxes[targetIndex];
      // ใช้ scrollIntoView ถ้ามี และ container เป็นแนวนอน
      try {
        targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch {
        // fallback คำนวณ scrollLeft เอง
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const offsetLeft = targetEl.offsetLeft - (container.clientWidth / 2) + (targetEl.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, offsetLeft), behavior: 'smooth' });
      }
    }, 0);
  }

  // scroll to field error
  scrollToFieldError(fieldName: string) {
    setTimeout(() => {
      const formField = document.querySelector(`[formControlName="${fieldName}"]`)?.closest('mat-form-field');
      if (formField) {
        const inputElement = formField.querySelector('input, mat-select, textarea');
        if (inputElement) {
          inputElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          (inputElement as HTMLElement).focus();
        }
      }
    }, 100);
  }

  // next step
  nextStep() {
    this.saveCurrentPassengerData();
    if (!this.isAllPassengersValid()) {
      // find first passenger with error
      for (const passengerNumber of this.numberPassengerArray) {
        const form = this.passengerForms[passengerNumber];
        if (form && form.invalid) {
          // change to passenger with error
          this.selectPassenger(passengerNumber);
          form.markAllAsTouched();
          // scroll to first error
          this.scrollToFirstError();
          return;
        }
      }
      return;
    }

    
    
    // แสดง dialog เมื่อจำนวน Adult/Child/Infant ไม่ตรงตาม expected
    if (this.isPaxCountsMatchingExpected()) {
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: {
          isDialog: 'alert_checkdata'
        }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          this.setPassengerData();
          this.router.navigate(['/select-seat']);
        }
      });
    } else {
      const { adults, children, infants } = this.countPaxFromForms();
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '350px',
        disableClose: true,
        data: {
          isDialog: 'alert_passenger_not_match',
          apiAdults: this.expectedAdults,
          apiChildren: this.expectedChildren,
          apiInfants: this.expectedInfants,
          currentAdults: adults,
          currentChildren: children,
          currentInfants: infants
        }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result.result === 'confirm') {
          this.setPassengerData();
          // this.router.navigate(['/select-seat']);
        }
      });
      // ตรงตาม expected ไปต่อได้เลย
      // this.setPassengerData();
      // this.router.navigate(['/select-seat']);
    }
  }

  setPassengerData() {
    if (!this.passengersData[1]) this.passengersData[1] = {} as any;
    if (!this.passengersData[1].dialCode) {
      this.passengersData[1].dialCode = '+66';
    }
    this.passDataService.setFormData(this.passengersData);
  }

  // check passenger valid
  checkPassengerValid(passenger: number) {
    const form = this.passengerForms[passenger];
    if (!form) {
      return;
    }
    
    if (form.valid) {
      this.nextPassenger();
    } else {
      form.markAllAsTouched();
      this.scrollToFirstError();
    }
  }

  minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const birth = new Date(value);
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= minAge ? null : { minAge: { required: minAge, actual: age } };
    };
  }

  notPastDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const inputDate = new Date(value);
      if (isNaN(inputDate.getTime())) return null;
      const today = new Date();
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return inputDate < today ? { pastDate: true } : null;
    };
  }

  // ตรวจสอบความถูกต้องของเบอร์โทรศัพท์ด้วย libphonenumber-js โดยอิงจาก dialCode
  private phoneNumberByDialCodeValidator(getDialCode: () => string | null): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const nationalPartRaw = (control.value ?? '').toString();
      if (!nationalPartRaw) return null; // ปล่อยให้ required จัดการค่าว่าง

      // เอาเฉพาะตัวเลขจากช่องเบอร์โทร
      const nationalPart = nationalPartRaw.replace(/\D/g, '');
      const dial = (getDialCode() || '').toString();
      if (!dial) return null; // ถ้าไม่มี dialCode ไม่บังคับตรวจ

      const normalizedDial = dial.startsWith('+') ? dial : `+${dial}`;
      const fullNumber = `${normalizedDial}${nationalPart}`;

      try {
        const parsed = parsePhoneNumberFromString(fullNumber);
        if (!parsed || !parsed.isValid()) {
          return { invalidPhoneByCountry: true };
        }
        return null;
      } catch (_) {
        return { invalidPhoneByCountry: true };
      }
    };
  }

  // isAnyFieldFilled(passenger: any): boolean {
  //   const controls = this.passengerForms[passenger].controls;
  //   return Object.values(controls).some(control => !!control.value);
  // }

  // check field valid
  isPassengerFieldValid(passenger: number, fieldName: string): boolean {
    const form = this.passengerForms[passenger];
    if (!form) return false;
    
    const control = form.get(fieldName);
    if (!control) return true; // if no control, consider it valid
    
    return !control.invalid || !control.touched;
  }

  // check if passenger has invalid and touched fields
  hasInvalidTouchedFields(passenger: number): boolean {
    const form = this.passengerForms[passenger];
    if (!form) return false;
    
    const baseFieldsP1 = ['selectedPrefix', 'firstName', 'lastName', 'birthDate'];
    const passportFields = ['passportNumber', 'issuedBy', 'expireDate'];
    const intlDemographicFields = ['nationality', 'country'];
    const contactFields = ['phoneNumber', 'email'];

    const requiredFields = passenger === 1 
      ? [
          ...baseFieldsP1,
          ...(this.isInternationalTrip ? intlDemographicFields : []),
          ...(this.isInternationalTrip ? passportFields : []),
          ...contactFields
        ]
      : [
          ...baseFieldsP1,
          ...(this.isInternationalTrip ? intlDemographicFields : []),
          ...(this.isInternationalTrip ? passportFields : [])
        ];
    
    return requiredFields.some(fieldName => {
      const control = form.get(fieldName);
      return control && control.invalid && control.touched;
    });
  }

  trackGroup(index: number, group: { letter: string; names: string[] }): string {
    return group.letter;
  }

  trackName(index: number, name: string): string {
    return name;
  }

  // toggle main assistance checkbox
  toggleMainAssistance() {
    if (!this.currentForm) return;
    
    const currentValue = this.currentForm.get('needsSpecialAssistance')?.value;
    const nextValue = !currentValue;
    this.currentForm.patchValue({ needsSpecialAssistance: nextValue });
    if (!nextValue) {
      this.ClearAllSpecialAssistance();
    }
  }

  toggleOption(optionName: string) {
    if (!this.currentForm) return;
    
    const currentValue = this.currentForm.get(optionName)?.value;
    this.currentForm.patchValue({
      [optionName]: !currentValue
    });
  }

  ClearAllSpecialAssistance() {
    if (!this.currentForm) return;
    
    this.currentForm.patchValue({
      disabledVision: false,
      disabledHearing: false,
      monk: false,
      nun: false,
      pregnantWoman: false,
      wheelchairUser: false,
      unaccompaniedMinor: false,
      other: false,
      otherReason: ''
    });
  }

  validateAndScrollToError() {
    if (!this.currentForm) return;
    
    if (this.currentForm.invalid) {
      this.currentForm.markAllAsTouched();
      this.scrollToFirstError();
    }
  }

  validateFieldAndScroll(fieldName: string) {
    if (!this.currentForm) return;
    
    const control = this.currentForm.get(fieldName);
    if (control && control.invalid && control.touched) {
      this.scrollToFieldError(fieldName);
    }
  }

  onPhoneNumberInput(event: any) {
    if (!this.currentForm) return;
    
    const phoneControl = this.currentForm.get('phoneNumber');
    if (!phoneControl) return;
    
    let value = (event?.target?.value ?? '').toString();

    // ตัดช่องว่างหัว-ท้ายออกทันที
    const trimmed = value.trim();
    if (trimmed !== value) {
      value = trimmed;
      if (event?.target) {
        event.target.value = value;
      }
      phoneControl.setValue(value, { emitEvent: false });
    }

    // ตัดเลข 0 นำหน้าถ้ามี (เมื่อความยาว > 1)
    if (value.startsWith('0') && value.length > 1) {
      value = value.substring(1);
      if (event?.target) {
        event.target.value = value;
      }
      phoneControl.setValue(value, { emitEvent: false });
    }
  }

  autoSelectIfSingle(controlName: 'nationality' | 'country' | 'issuedBy') {
    if (!this.currentForm) return;
    const control = this.currentForm.get(controlName);
    if (!control) return;
    const currentValue = control.value;
    if (currentValue === null || currentValue === undefined || currentValue === '') return;

    let options: string[] = [];
    if (controlName === 'nationality') options = this.lastFilteredNationalityOptions;
    if (controlName === 'country') options = this.lastFilteredCountryOptions;
    if (controlName === 'issuedBy') options = this.lastFilteredIssuedByOptions;

    if (options.length === 1 && currentValue !== options[0]) {
      // ต้อง emitEvent เมื่อเป็นสัญชาติ เพื่อให้ subscribeNationalityToDialCode ทำงานอัปเดต dial code
      const shouldEmit = controlName === 'nationality';
      control.setValue(options[0], { emitEvent: shouldEmit });
    }
  }

  autoSelectIfSingleDialCode() {
    if (!this.currentForm) return;
    const control = this.currentForm.get('dialCode');
    if (!control) return;
    const currentValue = control.value;
    if (currentValue === null || currentValue === undefined || currentValue === '') return;

    const options = this.lastFilteredDialCodeOptions;
    if (options.length === 1) {
      const only = options[0];
      const selected = typeof only === 'string' ? only : this.extractDialCode(only);
      if (currentValue !== selected) {
        control.setValue(selected, { emitEvent: false });
      }
    }
  }

  convertServiceBundle(data: ServiceBundleResponse) {
    this.serviceBundleRaw = data;
    return data;
  }

  hasOutboundDirection(): boolean {
    return Array.isArray(this.outboundFlightData) && this.outboundFlightData.length > 0;
  }

  hasInboundDirection(): boolean {
    return Array.isArray(this.inboundFlightData) && this.inboundFlightData.length > 0;
  }

  isRoundTrip(): boolean {
    return this.hasOutboundDirection() && this.hasInboundDirection();
  }
}
