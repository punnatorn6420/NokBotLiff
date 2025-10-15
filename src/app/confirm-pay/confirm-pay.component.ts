import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { PassDataService } from '../pass-data.service';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';

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

  currency = 'THB';
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
    private translate: TranslateService,
    private dialog: MatDialog) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.isLoading = true;
    this.getPricingSummary();
  }

  goBack() {
    this.router.navigate(['/review']);
  }
  goNext() {
    console.log(this.selectedPayment);
    if (this.selectedPayment === 'credit') {
      this.createBooking();
    } else if (this.selectedPayment === 'counterservice') {
      this.createBooking();
    }
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const n = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }

  formatAmount(amount: number): string {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${this.currency}`;
  }

  onPaymentMethodClick(method: string) {
    this.selectedPayment = method;
    this.isLoading = true;
    this.getPricingSummary();
  }

  private buildPayload(formData: any, seatData: any, flightData: any) {
    // map payment method: 'credit' => masterCard, 'counterservice' => counterService
    const paymentMethod = this.selectedPayment === 'credit' ? 'Visa' : 'CounterService';

    const toISODate = (d: any) => {
      if (!d) return '';
      const date = new Date(d);
      if (isNaN(date.getTime())) return String(d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const calcAge = (birth: any) => {
      if (!birth) return null as number | null;
      const bd = new Date(birth);
      if (isNaN(bd.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - bd.getFullYear();
      const m = today.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
      return age;
    };

    const guessGender = (title: string) => {
      const t = (title || '').toLowerCase();
      if (t.startsWith('mr')) return 'Male';
      if (t.startsWith('mrs') || t.startsWith('ms') || t.startsWith('miss')) return 'Female';
      return 'Unspecified';
    };

    const getPassengerTypeByAge = (age: number | null) => {
      if (age === null || age < 0) return 'Adult';
      if (age <= 1) return 'Infant';
      if (age <= 12) return 'Child';
      return 'Adult';
    };

    // คืน seat ของผู้โดยสารรายคนต่อ segment เช่น { outbound1: '9:J', inbound1: '9:K' }
    const getPassengerSeatBySegment = (paxNumber: number) => {
      const result: Record<string, string> = {};
      if (!seatData || typeof seatData !== 'object') return result;
      Object.keys(seatData).forEach(key => {
        // key กลุ่มที่นั่งของ segment เช่น 'outbound1', 'inbound1'
        if (['outbound', 'inbound'].some(prefix => key.startsWith(prefix)) && !key.endsWith('Price') && !key.endsWith('SelectedSeat')) {
          const mapForSegment = seatData[key];
          if (mapForSegment && typeof mapForSegment === 'object') {
            const seatLabel = mapForSegment[paxNumber - 1];
            if (seatLabel) result[key] = seatLabel;
          }
        }
      });
      return result;
    };

    // แปลง seat ให้เป็นรูปแบบมี ":" ระหว่างหมายเลขแถวและตัวอักษรที่นั่ง เช่น "7 A" -> "7:A"
    const normalizeSeatId = (raw: string): string => {
      if (!raw) return '';
      const s = String(raw).trim();
      // ถ้ามีโคลอนอยู่แล้ว ให้จัดรูปแบบเว้นวรรครอบโคลอนให้ถูกต้อง
      if (s.includes(':')) return s.replace(/\s*:\s*/, ':');
      // จับคู่รูปแบบเลขตามด้วยช่องว่าง (หรือไม่มีช่องว่าง) แล้วตามด้วยตัวอักษร
      const m = s.match(/^(\d+)\s*([A-Za-z])$/);
      if (m) return `${m[1]}:${m[2].toUpperCase()}`;
      // กรณีทั่วไป แทนที่ช่องว่างแรกด้วยโคลอน
      return s.replace(/\s+/, ':');
    };

    // สร้างรายละเอียดต่อ Journey สำหรับผู้โดยสารคนหนึ่ง โดยรวม selectedSeats และ addOnServices ต่อ journey
    const buildJourneyDetailsForPassenger = (paxNumber: number) => {
      const details: any[] = [];

      const outbound = flightData?.outbound_flight_select;
      const inbound = flightData?.inbound_flight_select;

      const passengerSeatMap = getPassengerSeatBySegment(paxNumber);

      // ดึง bundle ของผู้โดยสารตามทิศทาง (ถ้ามี)
      const getPassengerBundleByDirection = (direction: 'outbound' | 'inbound') => {
        const p = (formData as any)?.[String(paxNumber)] || {};
        if (direction === 'outbound') {
          return p?.['outboundBundle'] || null;
        }
        // รองรับทั้ง inboundBundle (เก่า) และ returnBundle (ใหม่) สำหรับทิศทางขากลับ
        return p?.['inboundBundle'] || p?.['returnBundle'] || null;
      };

      // Helper: รวมข้อมูลเที่ยวบินของฝั่งหนึ่งให้เป็นหนึ่ง journey detail
      const pushDirection = (direction: 'outbound' | 'inbound', selection: any) => {
        if (!selection) return;
        const journeyKey = selection.journey_key || '';
        const fareKey = selection.fare_key || '';
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

          // seatId ของผู้โดยสารรายคนจาก seat map ต่อ segment
          const seatId = passengerSeatMap[segKey] || '';
          if (seatId) {
            selectedSeats.push({ flightNumber, seatId: normalizeSeatId(seatId) });
          }

          if (bundleServiceCode) {
            addOnServices.push({ flightNumber, serviceCode: bundleServiceCode });
          }
        });

        details.push({
          journeyKey,
          fareKey,
          addOnServices,
          selectedSeats
        });
      };

      pushDirection('outbound', outbound);
      pushDirection('inbound', inbound);

      // ถ้าไม่มีข้อมูลเลย คืน placeholder หนึ่งรายการ
      return details.length > 0 ? details : [
        { journeyKey: '', fareKey: '', addOnServices: [], selectedSeats: [] }
      ];
    };

    // สร้าง passengerInfos โดยกำหนด travelWithPaxNumber เป็นของคนแรกหากอายุต่ำกว่า 12
    const sortedKeys = Object.keys(formData || {}).sort((a, b) => Number(a) - Number(b));
    const firstPaxNumber = sortedKeys.length > 0 ? Number(sortedKeys[0]) : 1;
    const passengerInfos = sortedKeys
      .map((key) => {
        const p = (formData as any)[key] || {};
        const paxNumber = Number(key);
        const title = p.selectedPrefix || p.title || '';
        const phone = p.phoneNumber ? `${p.dialCode || ''}${p.phoneNumber}` : '';
        const age = calcAge(p.birthDate);
        return {
          paxNumber,
          title,
          firstName: p.firstName || '',
          middleName: p.middleName || '',
          lastName: p.lastName || '',
          dateOfBirth: toISODate(p.birthDate),
          age,
          passengerType: getPassengerTypeByAge(age),
          gender: guessGender(title),
          mobilePhone: phone || '',
          homePhone: '',
          email: p.email || '',
          passportNumber: p.passportNumber || '',
          expiryDate: toISODate(p.expireDate),
          nationality: p.nationality || '',
          issueCountry: p.issuedBy || p.country || '',
          travelWithPaxNumber: age !== null && age < 1 ? firstPaxNumber : paxNumber,
          bookingJourneyDetails: buildJourneyDetailsForPassenger(paxNumber)
        };
      });

    return {
      paymentMethod,
      paymentNotificationInfo: {
        confirmationUrl: 'http://uat-ddservices.nokair.com/botnoi-liff/',
        failedUrl: 'http://uat-ddservices.nokair.com/botnoi-liff/',
        cancellationUrl: 'http://uat-ddservices.nokair.com/botnoi-liff/'
      },
      passengerInfos
    };
  }

  getPricingSummary() {
    combineLatest([
      this.passDataService.getFormData(),
      this.passDataService.getSeatData(),
      this.passDataService.getPassengerInfo()
    ]).pipe(take(1)).subscribe(([formData, seatData, flightWrapper]: any) => {
      const flightData = flightWrapper || this.passDataService.getFlightData();
      const payload = this.buildPayload(formData, seatData, flightData);
      console.log('Pricing payload:', payload);
      this.apiService.getPricingSummary(payload).subscribe((response: any) => {
        const code = String(
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

        if (code === 'SEAT ALREADY BOOKED') {
          this.router.navigate(['/error'], { queryParams: { isSeatAlreadyBooked: true } });
          return;
          }

        this.convertPricingSummary(response);
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

    const uniquePaxNumbers = new Set<number>();
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
        uniquePaxNumbers.add(pd?.paxNumber);
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

      // ให้มั่นใจว่ามีประเภทผู้โดยสารหลักครบถ้วนสำหรับค่าโดยสาร (เช่น ทารก) แม้ไม่มีค่าโดยสาร
      const ensuredTypes = ['ผู้ใหญ่', 'เด็ก', 'ทารก'];
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
    // เก็บทั้งยอดรวมและรายละเอียดคำอธิบายที่นั่ง
    const seatAmountMap = new Map<string, { amount: number; descriptions: Set<string> }>();
    let addOnTotal = 0;
    journeys.forEach((j: any) => {
      const passengerDetails: any[] = Array.isArray(j?.passengerDetails) ? j.passengerDetails : [];
      passengerDetails.forEach((pd: any) => {
        const typeLabel = paxLabelMap[pd?.paxType] || pd?.paxType || 'ผู้โดยสาร';
        const charges: any[] = Array.isArray(pd?.priceBreakdown?.charges) ? pd.priceBreakdown.charges : [];
        const st = pd?.priceBreakdown?.subtotals || {};
        // พิจารณาเฉพาะบริการเสริมที่เป็น "เลือกที่นั่ง" เท่านั้น (exclude payment/connecting fee)
        const isSeatRelated = (c: any) => {
          if (!c) return false;
          const type = String(c?.chargeType || '').toLowerCase();
          const code = String(c?.chargeCode || '').toUpperCase();
          const desc = String(c?.description || '').toLowerCase();
          // ตัดค่าธรรมเนียมการชำระเงินและค่าต่อเครื่องออก
          if (type.includes('payment')) return false;
          if (type === 'connectingflightfee' || code === 'FCF') return false;
          if (desc.includes('payment')) return false;
          return true;
        };

        const hasNonBundledSSR = charges.some((c: any) => c && c.isSSR && !c.isBundled && isSeatRelated(c));
        const hasBundledServices = charges.some((c: any) => c && c.isBundled);

        // เก็บเฉพาะ SSR ที่เกี่ยวกับที่นั่งจริง ๆ เท่านั้น
        charges.filter((c: any) => c && c.isSSR && !c.isBundled && isSeatRelated(c)).forEach((c: any) => {
          const amount = this.toNumber(c.amount);
          const record = seatAmountMap.get(typeLabel) || { amount: 0, descriptions: new Set<string>() };
          record.amount += amount;
          const desc = (c.description || '').toString().trim();
          if (desc) record.descriptions.add(desc);
          seatAmountMap.set(typeLabel, record);
          addOnTotal += amount;
        });
        // ตัด fallback ออกเพื่อป้องกันการนับค่าธรรมเนียมอื่น (เช่น PAYMENT) เป็นที่นั่ง
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
    const isAirportTax = (c: any) => {
      const type = String(c?.chargeType || '').toLowerCase();
      const code = String(c?.chargeCode || '').toUpperCase();
      const desc = String(c?.description || '').toLowerCase();
      return type === 'airporttax' || code === 'AT' || /air\s*t?port/.test(desc);
    };

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
    combineLatest([
      this.passDataService.getFormData(),
      this.passDataService.getSeatData(),
      this.passDataService.getPassengerInfo()
    ]).pipe(take(1)).subscribe(([formData, seatData, flightWrapper]: any) => {
      const flightData = flightWrapper || this.passDataService.getFlightData();
      const payload = this.buildPayload(formData, seatData, flightData);
      console.log('create booking payload:', payload);
      this.apiService.createBooking(payload).subscribe((response: any) => {
        // ตรวจสอบสถานะจาก response
        const status = String(response?.BookingConfirmationResponse?.status || response?.status || '').toLowerCase();
        const data = response?.BookingConfirmationResponse?.data || response?.data || null;
        if (status === 'success') {
          // ถ้าเป็น Counter Service ให้ไปหน้าถัดไป
          this.passDataService.setRecordLocator(data.recordLocator);
          if (this.selectedPayment === 'counterservice') {
            this.isLoading = false;
            this.router.navigate(['/counter-service']);
            return;
          }
          // กรณีบัตรเครดิต เปิดลิงก์ชำระเงินถ้ามี
          if (data && Array.isArray(data.externalPaymentInfo)) {
            const paymentLink = data.externalPaymentInfo?.[0]?.paymentLink;
            if (paymentLink) {
              window.location.href = paymentLink;
              return;
            }
          }
        }
        this.isLoading = false;
      }, (error: any) => {
        console.error('Error creating booking:', error);
        this.isLoading = false;
      });
    });
  }
}
