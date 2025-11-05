import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PassDataService } from '../../core/services/pass-data.service';
import { combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

interface BookingConfirmationResponse {
  collectionId: string;
  status: 'success' | 'error' | string;
  data: BookingData;
}

interface BookingData {
  confirmationNumber: string;
  bookingNumber: string;
  totalAmount: string; // string ตาม API
  currency: string;
  status: 'Paid' | 'Unpaid' | 'Pending' | string;
  bookDate: string; // ISO string
  holdTimeExpiredDate: string; // ISO string
  journeys: Journey[];
  payments: Payment[];
}

interface Journey {
  journeyId: string;
  direction: 'Outbound' | 'Inbound' | string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departureDate: string; // ISO string
  arrivalDate: string;   // ISO string
  isInternational: boolean;
  transportSegments: unknown[] | null;
  passengerDetails: PassengerDetail[];
}

interface PassengerDetail {
  paxNumber: number;
  paxType: 'Adult' | 'Child' | 'Infant' | string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string; // ISO string
  gender: 'Male' | 'Female' | 'Unspecified' | string;
  mobilePhone: string;
  homePhone: string;
  email: string;
  passportNumber: string;
  passportExpiryDate: string; // ISO string
  nationality: string;
  issueCountry: string;
  isPrimary: boolean;
  seatSelection: string;
  priceBreakdown: PriceBreakdown;
}

interface PriceBreakdown {
  charges: Charge[];
  subtotals: Subtotals;
  totalAmountBeforeVat: string;
  totalAmount: string;
  currency: string;
}

interface Charge {
  chargeCode: string;
  description: string;
  amount: string;
  vat: string;
  chargeType: string; // เช่น Tax, Fee
  isSSR: boolean;
  isBundled: boolean;
}

interface Subtotals {
  fareAmount: string;
  taxesAmount: string;
  feesAmount: string;
  paymentFeesAmount: string;
  servicesAmount: string;
  penaltiesAmount: string;
  discountsAmount: string; // อาจเป็นค่าลบ เช่น "-150.00"
  vatAmount: string;
}

interface Payment {
  paymentId: string;
  paymentGatewayReference: string;
  paymentMethod: string; // เช่น Visa
  paymentAmount: string;
  datePaid: string; // ISO string
  currency: string;
  cardNumber: string;
  paymentStatus: 'Success' | 'Pending' | 'Failed' | string;
}

@Component({
  selector: 'app-confirm-pay',
  templateUrl: './confirm-pay.component.html',
  styleUrls: ['./confirm-pay.component.scss']
})
export class ConfirmPayComponent {
  selectedPayment = 'credit';
  isLoading = false;
  token = '';
  userId = '';
  currency = 'THB';
  promoCode = '';
  ui: {
    journeys: Array<{
      direction: string;
      directionLabel: string;
      fareFamilyName: string;
      fareItems: Array<{ label: string; count: number; amount: number }>;
      bundleItems: Array<{ label: string; count: number; amount: number; description?: string }>;
      subtotal: number;
    }>;
    addOns: {
      seatItems: Array<{ label: string; count: number; amount: number; description?: string }>;
      total: number;
    };
    taxes: {
      airportTaxItems: Array<{ label: string; count: number; amount: number }>;
      vatItems: Array<{ label: string; count: number; amount: number }>;
      total: number;
    };
    fees: {
      connectingItems: Array<{ label: string; count: number; amount: number }>;
      total: number;
    };
    paymentFeePerPassenger: number;
    paymentFeePerTransaction: number;
    grandTotal: number;
  } = {
    journeys: [],
    addOns: { seatItems: [], total: 0 },
    taxes: { airportTaxItems: [], vatItems: [], total: 0 },
    fees: { connectingItems: [], total: 0 },
    paymentFeePerPassenger: 0,
    paymentFeePerTransaction: 0,
    grandTotal: 0
  };

  constructor(
    private router: Router,
    private apiService: ApiService,
    private passDataService: PassDataService,
    private translate: TranslateService) {

    }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.passDataService.getToken().subscribe((token: string) => {
      this.token = token;
    });
    this.passDataService.getUserId().subscribe((userId: string) => {
      this.userId = userId;
    });
    this.isLoading = true;
    this.getPricingSummary();
  }

  goBack() {
    this.router.navigate(['/review']);
  }
  goNext() {
    this.createBooking();
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const n = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }

  formatAmount(amount: number): string {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${this.currency}`;
  }

  // Helpers
  private toISODate(input: any): string {
    if (!input) return '';
    const date = new Date(input);
    if (isNaN(date.getTime())) return String(input);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private calcAge(birth: any): number | null {
    if (!birth) return null;
    const bd = new Date(birth);
    if (isNaN(bd.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }

  private guessGender(title: string): 'Male' | 'Female' | 'Unspecified' {
    const t = (title || '').toLowerCase();
    if (t.startsWith('mr')) return 'Male';
    if (t.startsWith('mrs') || t.startsWith('ms') || t.startsWith('miss')) return 'Female';
    return 'Unspecified';
  }

  private getPassengerTypeByAge(age: number | null): 'Adult' | 'Child' | 'Infant' {
    if (age === null || age < 0) return 'Adult';
    if (age <= 1) return 'Infant';
    if (age <= 12) return 'Child';
    return 'Adult';
  }

  private normalizeSeatId(raw: string): string {
    if (!raw) return '';
    const s = String(raw).trim();
    if (s.includes(':')) return s.replace(/\s*:\s*/, ':');
    const m = s.match(/^(\d+)\s*([A-Za-z])$/);
    if (m) return `${m[1]}:${m[2].toUpperCase()}`;
    return s.replace(/\s+/, ':');
  }

  private getPassengerSeatBySegment(seatData: any, paxNumber: number): Record<string, string> {
    const result: Record<string, string> = {};
    if (!seatData || typeof seatData !== 'object') return result;
    Object.keys(seatData).forEach(key => {
      if (['outbound', 'inbound'].some(prefix => key.startsWith(prefix)) && !key.endsWith('Price') && !key.endsWith('SelectedSeat')) {
        const mapForSegment = seatData[key];
        if (mapForSegment && typeof mapForSegment === 'object') {
          const seatLabel = mapForSegment[paxNumber - 1];
          if (seatLabel) result[key] = seatLabel;
        }
      }
    });
    return result;
  }

  private buildJourneyDetailsForPassenger(paxNumber: number, formData: any, seatData: any, flightData: any) {
    const details: any[] = [];
    const outbound = flightData?.outbound_flight_select;
    const inbound = flightData?.inbound_flight_select;
    const passengerSeatMap = this.getPassengerSeatBySegment(seatData, paxNumber);

    const getPassengerBundleByDirection = (direction: 'outbound' | 'inbound') => {
      const p = (formData as any)?.[String(paxNumber)] || {};
      if (direction === 'outbound') {
        return p?.['outboundBundle'] || null;
      }
      return p?.['inboundBundle'] || p?.['returnBundle'] || null;
    };

    const pushDirection = (direction: 'outbound' | 'inbound', selection: any) => {
      if (!selection) return;
      const journeyKey = selection?.journey_key;
      const fareKey = selection?.fare_key;
      if (!journeyKey || !fareKey) return;
      const serviceBundle = selection.service_bundle || null;
      const flights: any[] = Array.isArray(selection.flight_detail) ? selection.flight_detail : [];

      const selectedSeats: Array<{ flightNumber: string; seatId: string }> = [];
      const addOnServices: Array<{ flightNumber: string; serviceCode: string }> = [];

      const passengerBundle = getPassengerBundleByDirection(direction);
      const bundleServiceCode = (passengerBundle && passengerBundle.serviceCode)
        || (serviceBundle && serviceBundle.serviceCode)
        || '';

      flights.forEach((flight, idx) => {
        const segKey = `${direction}${idx + 1}`;
        const flightNumber = flight?.flightNumber || '';
        const seatId = passengerSeatMap[segKey] || '';
        if (seatId) {
          selectedSeats.push({ flightNumber, seatId: this.normalizeSeatId(seatId) });
        }
        if (bundleServiceCode) {
          addOnServices.push({ flightNumber, serviceCode: bundleServiceCode });
        }
      });

      details.push({ journeyKey, fareKey, addOnServices, selectedSeats });
    };

    pushDirection('outbound', outbound);
    pushDirection('inbound', inbound);

    return details.length > 0 ? details : [
      { journeyKey: '', fareKey: '', addOnServices: [], selectedSeats: [] }
    ];
  }

  private mapPaymentMethod(method: string): string {
    const mapping: Record<string, string> = { credit: 'Visa', counterservice: 'CounterService' };
    return mapping[method] || 'Visa';
  }

  private parseResponseCode(response: any): string {
    return String(
      response?.message ||
      response?.code ||
      response?.errorCode ||
      response?.error?.code ||
      response?.BookingConfirmationResponse?.message ||
      response?.BookingConfirmationResponse?.code ||
      response?.BookingConfirmationResponse?.data?.message ||
      response?.BookingConfirmationResponse?.data?.code ||
      response?.data?.message ||
      response?.data?.code ||
      ''
    ).toUpperCase();
  }

  private isSeatRelatedCharge(c: any): boolean {
    if (!c) return false;
    const type = String(c?.chargeType || '').toLowerCase();
    const code = String(c?.chargeCode || '').toUpperCase();
    const desc = String(c?.description || '').toLowerCase();
    if (type.includes('payment')) return false;
    if (type === 'connectingflightfee' || code === 'FCF') return false;
    if (desc.includes('payment')) return false;
    return true;
  }

  private isAirportTaxCharge(c: any): boolean {
    const type = String(c?.chargeType || '').toLowerCase();
    const code = String(c?.chargeCode || '').toUpperCase();
    const desc = String(c?.description || '').toLowerCase();
    return type === 'airporttax' || code === 'AT' || /air\s*t?port/.test(desc);
  }

  onPaymentMethodClick(method: string) {
    this.selectedPayment = method;
    this.isLoading = true;
    this.getPricingSummary();
  }

  private fetchContext() {
    return combineLatest([
      this.passDataService.getFormData(),
      this.passDataService.getSeatData(),
      this.passDataService.getPassengerInfo()
    ]).pipe(
      take(1),
      map(([formData, seatData, flightWrapper]: any) => ({
        formData,
        seatData,
        flightData: flightWrapper || this.passDataService.getFlightData()
      }))
    );
  }

  private buildPayload(formData: any, seatData: any, flightData: any) {
    const paymentMethod = this.mapPaymentMethod(this.selectedPayment);

    const sortedKeys = Object.keys(formData || {}).sort((a, b) => Number(a) - Number(b));
    const firstPaxNumber = sortedKeys.length > 0 ? Number(sortedKeys[0]) : 1;

    const passengerInfos = sortedKeys.map((key) => {
      const p = (formData as any)[key] || {};
      const paxNumber = Number(key);
      const title = p.selectedPrefix || p.title || '';
      const phone = p.phoneNumber ? `${p.dialCode || ''}${p.phoneNumber}` : '';
      const age = this.calcAge(p.birthDate);
      return {
        paxNumber,
        title,
        firstName: p.firstName || '',
        middleName: p.middleName || '',
        lastName: p.lastName || '',
        dateOfBirth: this.toISODate(p.birthDate),
        age,
        passengerType: this.getPassengerTypeByAge(age),
        gender: this.guessGender(title),
        mobilePhone: phone || '',
        homePhone: '',
        email: p.email || '',
        passportNumber: p.passportNumber || '',
        expiryDate: this.toISODate(p.expireDate),
        nationality: p.nationality || '',
        issueCountry: p.issuedBy || p.country || '',
        travelWithPaxNumber: age !== null && age < 1 ? firstPaxNumber : paxNumber,
        bookingJourneyDetails: this.buildJourneyDetailsForPassenger(paxNumber, formData, seatData, flightData)
      };
    });

    return {
      paymentMethod,
      paymentNotificationInfo: {
        // confirmationUrl: 'http://localhost:4200/botnoi-liff/payment-page?uid=' + this.userId + '&token=' + this.token + '&from=2c2p',
        // failedUrl: 'http://localhost:4200/botnoi-liff/payment-page?uid=' + this.userId + '&token=' + this.token,
        // cancellationUrl: 'http://localhost:4200/botnoi-liff/payment-page?uid=' + this.userId + '&token=' + this.token
        confirmationUrl: 'https://uat-ddservices.nokair.com/botnoi-liff/payment-page?uid=' + this.userId + '&token=' + this.token + '&from=2c2p',
        failedUrl: 'https://uat-ddservices.nokair.com/botnoi-liff/payment-status-fail?uid=' + this.userId + '&token=' + this.token,
        cancellationUrl: 'https://uat-ddservices.nokair.com/botnoi-liff/payment-page?uid=' + this.userId + '&token=' + this.token
      },
      passengerInfos
    };
  }

  getPricingSummary() {
    this.fetchContext().subscribe(({ formData, seatData, flightData }) => {
      const payload = this.buildPayload(formData, seatData, flightData);
      this.apiService.getPricingSummary(payload).subscribe((response: any) => {
        const code = this.parseResponseCode(response);
        if (code === 'SEAT ALREADY BOOKED') {
          this.router.navigate(['/error'], { queryParams: { isSeatAlreadyBooked: true } });
          return;
        }
        this.convertPricingSummary(response);
        this.isLoading = false;
      }, () => {
        this.isLoading = false;
      });
    });
  }

  convertPricingSummary(pricingSummary: any) {
    const root = pricingSummary?.BookingConfirmationResponse?.data || pricingSummary?.data || null;
    if (!root) return;

    this.currency = root.currency || 'THB';
    this.ui.grandTotal = this.toNumber(root.totalAmount);

    const directionLabelMap: Record<string, string> = {
      Outbound: this.translate.instant('CONFIRM_PAGE_Direction_Outbound'),
      Inbound: this.translate.instant('CONFIRM_PAGE_Direction_Inbound')
    };
    const paxLabelMap: Record<string, string> = {
      Adult: this.translate.instant('CONFIRM_PAGE_Pax_Adult'),
      Child: this.translate.instant('CONFIRM_PAGE_Pax_Child'),
      Infant: this.translate.instant('CONFIRM_PAGE_Pax_Infant')
    };

    const journeys: Journey[] = Array.isArray(root.journeys) ? root.journeys : [];
    // เก็บชุดผู้โดยสารไม่ซ้ำต่อประเภทไว้ใช้เป็นตัวเลข x{count}
    const paxSetByType = new Map<string, Set<number>>();
    // เก็บค่าธรรมเนียมชำระเงินที่เป็นค่าจริงต่อผู้โดยสาร (ไม่เอา 0)
    const paymentFeeAmounts: number[] = [];
    // รวมเฉพาะ Connecting Flight Fee แยกออกจาก payment fee
    const connectingMap = new Map<string, { count: number; amount: number }>();
    let connectingTotal = 0;

    // คำนวณข้อมูลต่อเที่ยวบิน
    this.ui.journeys = journeys.map((j: any) => {
      const fareItemsMap = new Map<string, { count: number; amount: number }>();
      const bundleItemsMap = new Map<string, { count: number; amount: number; descriptions: Set<string> }>();
      // เก็บชุดผู้โดยสารที่มี bundled ต่อประเภท ต่อเที่ยวบินนี้ (count แบบไม่ซ้ำคน)
      const bundledPaxSetByTypeForThisJourney = new Map<string, Set<number>>();
      let subtotal = 0;

      const passengerDetails: any[] = Array.isArray(j?.passengerDetails) ? j.passengerDetails : [];

      passengerDetails.forEach((pd: any) => {
        const typeLabel = paxLabelMap[pd?.paxType] || pd?.paxType || 'ผู้โดยสาร';
        // อัปเดตชุดผู้โดยสารตามประเภท (เพื่อใช้เป็นตัวเลขจำนวนจริง ไม่ซ้ำขา/เซกเมนต์)
        const set = paxSetByType.get(typeLabel) || new Set<number>();
        set.add(pd?.paxNumber);
        paxSetByType.set(typeLabel, set);

        const st = pd?.priceBreakdown?.subtotals || {};
        const charges: any[] = Array.isArray(pd?.priceBreakdown?.charges) ? pd.priceBreakdown.charges : [];

        const fareAmount = this.toNumber(st?.fareAmount);
        if (fareAmount > 0) {
          const prev = fareItemsMap.get(typeLabel) || { count: 0, amount: 0 };
          prev.count += 1;
          prev.amount += fareAmount;
          fareItemsMap.set(typeLabel, prev);
          subtotal += fareAmount;
        }

        // Special Bundle = charges ที่ถูก bundle มากับ fare
        charges.filter((c: any) => c && c.isBundled).forEach((c: any) => {
          const prev = bundleItemsMap.get(typeLabel) || { count: 0, amount: 0, descriptions: new Set<string>() };
          // เพิ่มเฉพาะยอดเงินรวมของ bundle ต่อประเภท และเก็บคำอธิบาย
          prev.amount += this.toNumber(c.amount);
          const desc = (c.description || '').toString().trim();
          if (desc) prev.descriptions.add(desc);
          bundleItemsMap.set(typeLabel, prev);
          subtotal += this.toNumber(c.amount);
          // นับจำนวนผู้โดยสารที่มี bundle แบบ unique ต่อประเภท
          const set = bundledPaxSetByTypeForThisJourney.get(typeLabel) || new Set<number>();
          set.add(pd?.paxNumber);
          bundledPaxSetByTypeForThisJourney.set(typeLabel, set);
        });

        if (st && st.paymentFeesAmount !== undefined && st.paymentFeesAmount !== null) {
          const fee = this.toNumber(st.paymentFeesAmount);
          if (fee > 0) {
            paymentFeeAmounts.push(fee);
          }
        }

        // ค่าธรรมเนียมต่อเครื่อง (Connecting Flight Fee) จาก charges ต่อผู้โดยสาร
        charges
          .filter((c: any) => c && (String(c.chargeType).toLowerCase() === 'connectingflightfee' || String(c.chargeCode).toUpperCase() === 'FCF'))
          .forEach((c: any) => {
            const prev = connectingMap.get(typeLabel) || { count: 0, amount: 0 };
            prev.count += 1;
            prev.amount += this.toNumber(c.amount);
            connectingMap.set(typeLabel, prev);
            connectingTotal += this.toNumber(c.amount);
          });
      });

      // ให้มั่นใจว่ามีประเภทผู้โดยสารหลักครบถ้วนสำหรับค่าโดยสาร แม้ไม่มีค่าโดยสาร
      const ensuredTypes = ['Adult', 'Child', 'Infant'].map(t => paxLabelMap[t] || t);
      ensuredTypes.forEach((label) => {
        if (!fareItemsMap.has(label)) {
          fareItemsMap.set(label, { count: (paxSetByType.get(label) || new Set<number>()).size, amount: 0 });
        }
      });

      const fareItems = Array.from(fareItemsMap.entries())
        .sort((a, b) => ensuredTypes.indexOf(a[0]) - ensuredTypes.indexOf(b[0]))
        .map(([label, v]) => ({ label, count: v.count, amount: v.amount }))
        .filter(item => item.count > 0);
      const bundleItems = Array.from(bundleItemsMap.entries())
        .map(([label, v]) => ({
          label,
          // ใช้จำนวนผู้โดยสารที่มี bundled จริงแบบไม่ซ้ำ ต่อเที่ยวบินนี้
          count: (bundledPaxSetByTypeForThisJourney.get(label) || new Set<number>()).size,
          amount: v.amount,
          description: Array.from(v.descriptions || [])?.join(' / ')
        }))
        .filter(item => item.amount > 0);

      return {
        direction: j?.direction || '',
        directionLabel: directionLabelMap[j?.direction] || j?.direction || '',
        fareFamilyName: 'Nok Lite',
        fareItems,
        bundleItems,
        subtotal
      };
    });

    // บริการเสริม (เช่น เลือกที่นั่ง): ใช้ charges ที่เป็น SSR และไม่ bundled
    const seatAmountMap = new Map<string, { amount: number; descriptions: Set<string> }>();
    let addOnTotal = 0;
    journeys.forEach((j: any) => {
      const passengerDetails: any[] = Array.isArray(j?.passengerDetails) ? j.passengerDetails : [];
      passengerDetails.forEach((pd: any) => {
        const typeLabel = paxLabelMap[pd?.paxType] || pd?.paxType || 'ผู้โดยสาร';
        const charges: any[] = Array.isArray(pd?.priceBreakdown?.charges) ? pd.priceBreakdown.charges : [];
        // พิจารณาเฉพาะบริการเสริมที่เป็น "เลือกที่นั่ง" เท่านั้น (exclude payment/connecting fee)
        charges.filter((c: any) => c && c.isSSR && !c.isBundled && this.isSeatRelatedCharge(c)).forEach((c: any) => {
          const amount = this.toNumber(c.amount);
          const record = seatAmountMap.get(typeLabel) || { amount: 0, descriptions: new Set<string>() };
          record.amount += amount;
          const desc = (c.description || '').toString().trim();
          if (desc) record.descriptions.add(desc);
          seatAmountMap.set(typeLabel, record);
          addOnTotal += amount;
        });
      });
    });
    this.ui.addOns = {
      seatItems: Array.from(seatAmountMap.entries()).map(([label, data]) => ({
        label,
        count: (paxSetByType.get(label) || new Set<number>()).size,
        amount: data.amount,
        description: Array.from(data.descriptions || [])?.join(' / ')
      })),
      total: addOnTotal
    };

    // ภาษี (กลุ่ม Airport Tax และ VAT)
    const airportAmountMap = new Map<string, number>();
    const vatAmountMap = new Map<string, number>();
    let taxTotal = 0;
    const isAirportTax = (c: any) => this.isAirportTaxCharge(c);

    journeys.forEach((j: any) => {
      const passengerDetails: any[] = Array.isArray(j?.passengerDetails) ? j.passengerDetails : [];
      passengerDetails.forEach((pd: any) => {
        const typeLabel = paxLabelMap[pd?.paxType] || pd?.paxType || 'ผู้โดยสาร';
        const charges: any[] = Array.isArray(pd?.priceBreakdown?.charges) ? pd.priceBreakdown.charges : [];
        const st = pd?.priceBreakdown?.subtotals || {};
        // Airport Tax จาก charges ด้วย chargeType/chargeCode เป็นหลัก
        charges.forEach((c: any) => {
          const amount = this.toNumber(c?.amount);
          if (amount <= 0) return;
          if (isAirportTax(c)) {
            const prevAmount = airportAmountMap.get(typeLabel) || 0;
            airportAmountMap.set(typeLabel, prevAmount + amount);
            taxTotal += amount;
          }
        });

        // VAT ใช้ค่าจาก subtotals.vatAmount โดยตรงต่อผู้โดยสาร
        const vatAmount = this.toNumber(st?.vatAmount);
        if (vatAmount > 0) {
          const prevAmount = vatAmountMap.get(typeLabel) || 0;
          vatAmountMap.set(typeLabel, prevAmount + vatAmount);
          taxTotal += vatAmount;
        }
      });
    });
    this.ui.taxes = {
      airportTaxItems: Array.from(airportAmountMap.entries()).map(([label, amount]) => ({
        label,
        count: (paxSetByType.get(label) || new Set<number>()).size,
        amount
      })),
      vatItems: Array.from(vatAmountMap.entries()).map(([label, amount]) => ({
        label,
        count: (paxSetByType.get(label) || new Set<number>()).size,
        amount
      })),
      total: taxTotal
    };

    // Connecting Fee UI
    this.ui.fees = {
      connectingItems: Array.from(connectingMap.entries()).map(([label, v]) => ({
        label,
        count: (paxSetByType.get(label) || new Set<number>()).size,
        amount: v.amount
      })),
      total: connectingTotal
    };

    // ค่าธรรมเนียมชำระเงิน (แยกจาก Connecting Fee)
    // ใช้ค่าที่ไม่เป็นศูนย์ต่อผู้โดยสาร (เช่น 100 ต่อคน) โดยเลือกค่าสูงสุดที่พบเพื่อกันค่าเฉลี่ยถูกดึงลงด้วย 0
    this.ui.paymentFeePerPassenger = paymentFeeAmounts.length > 0
      ? Math.max(...paymentFeeAmounts)
      : 0;
    // ไม่รวม Connecting Fee ใน per transaction อีกต่อไป
    this.ui.paymentFeePerTransaction = paymentFeeAmounts.length > 0
    ? Math.max(...paymentFeeAmounts)
    : 0;
  }

  
  createBooking() {
    this.isLoading = true;
    this.fetchContext().subscribe(({ formData, seatData, flightData }) => {
      const payload = this.buildPayload(formData, seatData, flightData);
      this.apiService.createBooking(payload).subscribe((response: any) => {
        const code = this.parseResponseCode(response);
        if (code === 'SEAT ALREADY BOOKED') {
          this.router.navigate(['/error'], { queryParams: { isSeatAlreadyBooked: true } });
          return;
        }
        // ตรวจสอบสถานะจาก response
        const status = String(response?.BookingConfirmationResponse?.status || response?.status || '').toLowerCase();
        const data = response?.BookingConfirmationResponse?.data || response?.data || null;
        if (status === 'success') {
          this.passDataService.setRecordLocator(data.recordLocator);
          if (this.selectedPayment === 'counterservice') {
            this.isLoading = false;
            this.router.navigate(['/payment-page']);
            return;
          }
          if (data && Array.isArray(data.externalPaymentInfo)) {
            const paymentLink = data.externalPaymentInfo?.[0]?.paymentLink;
            if (paymentLink) {
              window.location.href = paymentLink;
              return;
            }
          }
        }
        this.isLoading = false;
      }, () => {
        this.isLoading = false;
      });
    });
  }
}
