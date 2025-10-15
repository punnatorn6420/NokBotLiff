import { Component, ElementRef, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
// import { TranslateService } from '@ngx-translate/core';
import { PassDataService } from '../pass-data.service';
import { ApiService } from '../api.service';
@Component({
  selector: 'app-counter-service-page',
  templateUrl: './counter-service-page.component.html',
  styleUrls: ['./counter-service-page.component.scss']
})
export class CounterServicePageComponent {

  passengerName: string = '';
  outboundView: any = null;
  inboundView: any = null;
  // booking data from retrieveBooking API
  bookingRecordLocator: string = '';
  bookingReferencePNR: string = '';
  bookingId: string = '';
  paymentReferenceNumber: string = '';
  holdExpireDisplay: string = '';
  bookingStatus: string = '';
  isLoading: boolean = false;

  constructor(
    // private translate: TranslateService,
    private passDataService: PassDataService,
    private apiService: ApiService
  ) {
    // this.passDataService.getLanguage().subscribe((language) => {
    //   this.switchLanguage(language);
    // });
  }

  ngOnInit() {
    this.isLoading = true;
    this.passDataService.getRecordLocator().subscribe((recordLocator: string) => {
      this.apiService.retrieveBooking(recordLocator).subscribe((bookingData: any) => {
        this.hydrateBooking(bookingData);
        this.isLoading = false;
      });
    });
    this.passDataService.getPassengerInfo().subscribe((info: any) => {
      if (info) {
        this.outboundView = this.buildFlightView(info.outbound_flight_select, 'outbound');
        this.inboundView = this.buildFlightView(info.inbound_flight_select, 'inbound');
      }
    });
    this.passDataService.getFormData().subscribe((formData: any) => {
      this.passengerName = this.buildPassengerName(formData);
    });
  }

    // switchLanguage(language: string) {
    //   this.translate.use(language);
    // }


  private hydrateBooking(resp: any) {
    if (!resp || resp.status !== 'Success' || !resp.data) return;
    const data = resp.data;
    this.bookingRecordLocator = data.recordLocator || '';
    this.bookingReferencePNR = data.recordLocator || '';
    this.bookingId = (data.bookingId || '').toString();
    this.bookingStatus = data.status || '';

    // Prefer bookingId as payment reference, then confirmationNumber, then recordLocator
    this.paymentReferenceNumber = (data.bookingId || data.recordLocator || '').toString();

    // holdTimeExpiredDate might be '0001-01-01T00:00:00' when not set
    this.holdExpireDisplay = this.buildExpireText(data.bookDate, data.holdTimeExpiredDate);

    // Prefer journeys from API when available to build views
    // try {
    //   if (Array.isArray(data.journeys) && data.journeys.length > 0) {
    //     const outbound = data.journeys.find((j: any) => (j.direction || '').toLowerCase() === 'outbound') || data.journeys[0];
    //     const inbound = data.journeys.find((j: any) => (j.direction || '').toLowerCase() === 'inbound');
    //     this.outboundView = this.buildFlightViewFromRetrieve(outbound);
    //     this.inboundView = inbound ? this.buildFlightViewFromRetrieve(inbound) : this.inboundView;

    //     // passenger name from API if not already set
    //     if (!this.passengerName) {
    //       const pax = outbound?.passengerDetails?.[0];
    //       if (pax) {
    //         this.passengerName = this.buildPassengerNameFromOne({
    //           title: pax.title,
    //           firstName: pax.firstName,
    //           middleName: pax.middleName,
    //           lastName: pax.lastName
    //         });
    //       }
    //     }
    //   }
    // } catch { /* no-op */ }
  }

  private buildExpireText(bookDate: string, holdTimeExpiredDate: string): string {
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

  private buildPassengerName(formData: any): string {
    if (!formData || typeof formData !== 'object') return '';
    const firstKey = Object.keys(formData).sort((a, b) => Number(a) - Number(b))[0];
    if (!firstKey) return '';
    return this.buildPassengerNameFromOne(formData[firstKey]);
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

  private buildFlightView(selection: any, direction: 'outbound' | 'inbound'): any {
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

  private buildFlightViewFromRetrieve(journey: any): any {
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
}
