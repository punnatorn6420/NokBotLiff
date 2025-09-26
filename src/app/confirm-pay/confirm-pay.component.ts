import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { PassDataService } from '../pass-data.service';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

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
  selectedPayment = 'counterservice';
  isLoading = false;

  currency = 'THB';
  ui: {
    journeys: Array<{
      direction: string;
      directionLabel: string;
      fareFamilyName: string;
      fareItems: Array<{ label: string; count: number; amount: number }>;
      bundleItems: Array<{ label: string; count: number; amount: number }>;
      subtotal: number;
    }>;
    addOns: {
      seatItems: Array<{ label: string; count: number; amount: number }>;
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
    private passDataService: PassDataService) {}

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
      this.router.navigate(['/credit']);
    } else if (this.selectedPayment === 'counterservice') {
      this.router.navigate(['/counter-service']);
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
    const paymentMethod = this.selectedPayment === 'credit' ? 'masterCard' : 'counterService';

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

    // สร้างรายละเอียดต่อ Journey สำหรับผู้โดยสารคนหนึ่ง โดยมี selectedSeats และ addOnServices ต่อ segment
    const buildJourneyDetailsForPassenger = (paxNumber: number) => {
      const details: any[] = [];

      const outbound = flightData?.outbound_flight_select;
      const inbound = flightData?.inbound_flight_select;

      const passengerSeatMap = getPassengerSeatBySegment(paxNumber);

      // Helper: แปลงข้อมูลเที่ยวบินของฝั่งหนึ่งให้เป็นรายการ journey details ต่อ flight segment
      const pushDirection = (direction: 'outbound' | 'inbound', selection: any) => {
        if (!selection) return;
        const journeyKey = selection.journey_key || '';
        const fareKey = selection.fare_key || '';
        const serviceBundle = selection.service_bundle || null;
        const flights: any[] = Array.isArray(selection.flight_detail) ? selection.flight_detail : [];

        flights.forEach((flight, idx) => {
          const segKey = `${direction}${idx + 1}`;
          const flightNumber = flight?.flightNumber || '';

          // seatId ของผู้โดยสารรายคนจาก seat map ต่อ segment
          const seatId = passengerSeatMap[segKey] || '';

          // addOnServices: อิงจาก service bundle ถ้ามี (แนบตาม flight)
          const addOnServices = serviceBundle && serviceBundle.serviceCode
            ? [{ flightNumber, serviceCode: serviceBundle.serviceCode }]
            : [];

          details.push({
            journeyKey,
            fareKey,
            addOnServices,
            selectedSeats: seatId ? [{ flightNumber, seatId }] : []
          });
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

    const directionLabelMap: Record<string, string> = { Outbound: 'ไป', Inbound: 'กลับ' };
    const paxLabelMap: Record<string, string> = { Adult: 'ผู้ใหญ่', Child: 'เด็ก', Infant: 'ทารก' };

    const journeys: Journey[] = Array.isArray(root.journeys) ? root.journeys : [];

    const uniquePaxNumbers = new Set<number>();
    // เก็บชุดผู้โดยสารไม่ซ้ำต่อประเภทไว้ใช้เป็นตัวเลข x{count}
    const paxSetByType = new Map<string, Set<number>>();
    let sumPaymentFeesAmount = 0;
    let countPaymentFeeEntries = 0;
    // รวมเฉพาะ Connecting Flight Fee แยกออกจาก payment fee
    const connectingMap = new Map<string, { count: number; amount: number }>();
    let connectingTotal = 0;

    // คำนวณข้อมูลต่อเที่ยวบิน
    this.ui.journeys = journeys.map((j: any) => {
      const fareItemsMap = new Map<string, { count: number; amount: number }>();
      const bundleItemsMap = new Map<string, { count: number; amount: number }>();
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
          const prev = bundleItemsMap.get(typeLabel) || { count: 0, amount: 0 };
          prev.count += 1;
          prev.amount += this.toNumber(c.amount);
          bundleItemsMap.set(typeLabel, prev);
          subtotal += this.toNumber(c.amount);
        });

        if (st && st.paymentFeesAmount) {
          sumPaymentFeesAmount += this.toNumber(st.paymentFeesAmount);
          countPaymentFeeEntries += 1;
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
        .map(([label, v]) => ({ label, count: v.count, amount: v.amount }))
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
    const seatAmountMap = new Map<string, number>();
    let addOnTotal = 0;
    journeys.forEach((j: any) => {
      const passengerDetails: any[] = Array.isArray(j?.passengerDetails) ? j.passengerDetails : [];
      passengerDetails.forEach((pd: any) => {
        const typeLabel = paxLabelMap[pd?.paxType] || pd?.paxType || 'ผู้โดยสาร';
        const charges: any[] = Array.isArray(pd?.priceBreakdown?.charges) ? pd.priceBreakdown.charges : [];
        const st = pd?.priceBreakdown?.subtotals || {};
        charges.filter((c: any) => c && c.isSSR && !c.isBundled).forEach((c: any) => {
          const amount = this.toNumber(c.amount);
          const prevAmount = seatAmountMap.get(typeLabel) || 0;
          seatAmountMap.set(typeLabel, prevAmount + amount);
          addOnTotal += amount;
        });
        // หากไม่มี charges สำหรับบริการเสริม ให้ใช้ยอดรวม servicesAmount ต่อผู้โดยสาร
        const servicesAmount = this.toNumber(st?.servicesAmount);
        if (servicesAmount > 0 && !charges.some(c => c && c.isSSR && !c.isBundled)) {
          const prevAmount = seatAmountMap.get(typeLabel) || 0;
          seatAmountMap.set(typeLabel, prevAmount + servicesAmount);
          addOnTotal += servicesAmount;
        }
      });
    });
    this.ui.addOns = {
      seatItems: Array.from(seatAmountMap.entries()).map(([label, amount]) => ({
        label,
        count: (paxSetByType.get(label) || new Set<number>()).size,
        amount
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
    this.ui.paymentFeePerPassenger = countPaymentFeeEntries > 0
      ? sumPaymentFeesAmount / countPaymentFeeEntries
      : 0;
    // ไม่รวม Connecting Fee ใน per transaction อีกต่อไป
    this.ui.paymentFeePerTransaction = 0;
  }
}
