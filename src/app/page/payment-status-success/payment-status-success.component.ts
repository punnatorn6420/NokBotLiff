import { Component, OnInit } from '@angular/core';
import { PassDataService } from '../../core/services/pass-data.service';
import { ApiService } from '../../core/services/api.service';
import { of } from 'rxjs';
import { finalize, switchMap, tap, take } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-payment-status-success',
  templateUrl: './payment-status-success.component.html',
  styleUrls: ['./payment-status-success.component.scss']
})
export class PaymentStatusSuccessComponent implements OnInit {

  passengerName: string = '';
  outboundView: FlightView | null = null;
  inboundView: FlightView | null = null;
  // booking data from retrieveBooking API
  bookingRecordLocator: string = '';
  bookingReferencePNR: string = '';
  bookingId: string = '';
  paymentReferenceNumber: string = '';
  holdExpireDisplay: string = '';
  bookingStatus: string = '';
  isLoading: boolean = false;
  userId: string = '';
  language: string = '';
  pnr: string = '';

  constructor(
    private passDataService: PassDataService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    const isFrom2c2p = this.isFrom2c2p();
    this.loadContextAndBooking(isFrom2c2p);
  }

  private isFrom2c2p(): boolean {
    const searchParams = new URLSearchParams(window.location.search);
    return ((searchParams.get('from') || '').toLowerCase() === '2c2p');
  }

  private loadContextAndBooking(isFrom2c2p: boolean): void {
    this.passDataService
      .getUserId()
      .pipe(
        take(1),
        tap((userId: string) => {
          this.userId = userId;
        }),
        switchMap((userId: string) => this.apiService.getPassengerInfo(userId)),
        switchMap((info: any) => {
          if (info) {
            if (info.language) {
              this.language = info.language;
              this.translate.use(this.language);
            }
            if (info.outbound_flight_select) {
              this.outboundView = this.buildFlightView(info.outbound_flight_select, 'outbound');
            }
            if (info.inbound_flight_select) {
              this.inboundView = this.buildFlightView(info.inbound_flight_select, 'inbound');
            }
            if (info.pnr) {
              this.pnr = info.pnr;
              return this.apiService
                .retrieveBooking(info.pnr, this.language)
                .pipe(tap((bookingData: any) => this.hydrateBooking(bookingData, isFrom2c2p)));
            }
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {},
        error: () => {}
      });
  }


  private hydrateBooking(resp: any, isFrom2c2p?: boolean) {
    if (!resp || resp.status !== 'Success' || !resp.data) return;
    const data = resp.data;
    this.bookingRecordLocator = data.recordLocator || '';
    this.bookingReferencePNR = data.recordLocator || '';
    this.bookingId = (data.bookingId || '').toString();
    this.bookingStatus = data.status || '';

    // Prefer bookingId as payment reference, then confirmationNumber, then recordLocator
    this.paymentReferenceNumber = (data.bookingId || data.recordLocator || '').toString();

    // holdTimeExpiredDate might be '0001-01-01T00:00:00' when not set
    this.holdExpireDisplay = this.buildExpireText(data.holdTimeExpiredDate);

    // Prefer journeys from API when available to build views
    try {
      if (Array.isArray(data.journeys) && data.journeys.length > 0) {
        const outbound = data.journeys.find((j: any) => (j.direction || '').toLowerCase() === 'outbound') || data.journeys[0];
        const inbound = data.journeys.find((j: any) => (j.direction || '').toLowerCase() === 'inbound');
        this.outboundView = this.buildFlightViewFromRetrieve(outbound);
        this.inboundView = inbound ? this.buildFlightViewFromRetrieve(inbound) : this.inboundView;

        // passenger name from API if not already set
        if (!this.passengerName) {
          const pax = (outbound?.passengerDetails || []).find((p: any) => p?.isPrimary) || outbound?.passengerDetails?.[0];
          if (pax) {
            this.passengerName = this.buildPassengerNameFromOne({
              title: pax.title,
              firstName: pax.firstName,
              middleName: pax.middleName,
              lastName: pax.lastName
            });
          }
        }
      }
    } catch { /* no-op */ }

    // ส่งข้อความเข้า LINE แชท เมื่อสถานะการชำระเงินเป็น Paid (และส่งเพียงครั้งเดียวต่อ booking)
    if (isFrom2c2p && (this.bookingStatus || '').toLowerCase() === 'paid') {
      this.trySendPaidMessageOnce();
    }
  }

  private buildExpireText(holdTimeExpiredDate: string): string {
    const invalid = !holdTimeExpiredDate || holdTimeExpiredDate.startsWith('0001-');
    if (invalid) return '';
    const d = new Date(holdTimeExpiredDate);
    if (isNaN(d.getTime())) return '';
    // Display in Thai Buddhist year
    const y = d.getFullYear() + 543;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${mm}-${dd} ${hh}:${mi}`;
  }

  private buildPassengerNameFromOne(p: any): string {
    if (!p) return '';
    const parts = [p.selectedPrefix || p.title, p.firstName, p.middleName, p.lastName].filter(Boolean);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private formatThaiShortDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    try {
      const f = new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
      return f.format(d);
    } catch {
      return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' } as any);
    }
  }

  private formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private buildFlightView(selection: any, direction: TripDirection): FlightView | null {
    if (!selection || !Array.isArray(selection.flight_detail) || selection.flight_detail.length === 0) return null;
    const flights = selection.flight_detail;
    const first = flights[0];
    const last = flights[flights.length - 1];

    const originCode = first?.originAirportCode || '';
    const originName = first?.originAirportName || '';
    const destCode = last?.destinationAirportCode || '';
    const destName = last?.destinationAirportName || '';

    const directionText = direction === 'outbound' ? 'เที่ยวบินขาไป' : 'เที่ยวบินขากลับ';
    const header = `${directionText} (${originCode} → ${destCode})`;
    const dateText = this.formatThaiShortDate(first?.departureDateTime || '');
    const depTime = this.formatTime(first?.departureDateTime || '');
    const arrTime = this.formatTime(last?.arrivalDateTime || '');
    const stops = Math.max(0, flights.length - 1);
    const stopText = stops > 0 ? `${stops} Stop` : 'Direct';

    return {
      header,
      dateText,
      depTime,
      arrTime,
      originText: `${originName} (${originCode})`,
      stopText,
      destText: `${destName} (${destCode})`
    };
  }

  private buildFlightViewFromRetrieve(journey: any): FlightView | null {
    if (!journey || !Array.isArray(journey.transportSegments) || journey.transportSegments.length === 0) return null;
    const segments = journey.transportSegments;
    const first = segments[0] || {};
    const last = segments[segments.length - 1] || {};

    const originCode = first.origin || '';
    const originName = first.originName || '';
    const destCode = last.destination || '';
    const destName = last.destinationName || '';

    const directionText = (journey.direction || '').toLowerCase() === 'inbound' ? 'เที่ยวบินขากลับ' : 'เที่ยวบินขาไป';
    const header = `${directionText} (${originCode} → ${destCode})`;
    const dateText = this.formatThaiShortDate(first.departureDate || '');
    const depTime = this.formatTime(first.departureDate || '');
    const arrTime = this.formatTime(last.arrivalDate || '');
    const stops = Math.max(0, segments.length - 1);
    const stopText = stops > 0 ? `${stops} Stop` : 'Direct';

    return {
      header,
      dateText,
      depTime,
      arrTime,
      originText: `${originName} (${originCode})`,
      stopText,
      destText: `${destName} (${destCode})`
    };
  }

  private trySendPaidMessageOnce(): void {
    const ref = this.pnr;
    // กรณี Desktop หรือไม่ใช่ LIFF ให้เรียก backend push message
    if (this.userId) {
      this.apiService.pushMessage(this.userId, ref, this.language).subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }
}

type TripDirection = 'outbound' | 'inbound';

interface FlightView {
  header: string;
  dateText: string;
  depTime: string;
  arrTime: string;
  originText: string;
  stopText: string;
  destText: string;
}
