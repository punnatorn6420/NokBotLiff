import { Component, OnInit } from '@angular/core';
import { PassDataService } from './core/services/pass-data.service';
import { LiffService } from './core/services/liff.service';
import { ApiService } from './core/services/api.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'liff-nok-air';
  language: string = 'th';
  token: string = '';

  constructor(
    private readonly passDataService: PassDataService,
    private readonly liffService: LiffService,
    private readonly apiService: ApiService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    const { uid, token } = this.resolveUidAndToken();

    if (token) {
      this.passDataService.setToken(token);
      this.token = token;
    }

    if (uid) {
      this.passDataService.setUserId(uid);
      this.fetchInitialData(uid);
      return;
    }

    this.handleLiffFlow();
  }

  private async handleLiffFlow(): Promise<void> {
    await this.liffService.initializeLiff();

    if (!this.liffService.isLoggedIn()) {
      await this.liffService.login(this.token);
      return;
    }

    const profile = await this.liffService.getProfile();
    const userId = profile?.userId;
    if (userId) {
      this.passDataService.setUserId(userId);
      this.fetchInitialData(userId);
    }
  }

  private resolveUidAndToken(): { uid: string | null; token: string | null } {
    const searchParams = new URLSearchParams(window.location.search);
    const uidFromQuery = searchParams.get('uid') || searchParams.get('UID');
    const tokenFromQuery = searchParams.get('token') || searchParams.get('TOKEN');
    const uidFromHrefMatch = window.location.href.match(/[?&]uid=([^&#]+)/i);
    const uidFromHref = uidFromHrefMatch ? decodeURIComponent(uidFromHrefMatch[1]) : null;
    const resolvedUid = (uidFromQuery || uidFromHref || '').trim();
    const resolvedToken = (tokenFromQuery || '').trim();

    return {
      uid: resolvedUid.length > 0 ? resolvedUid : null,
      token: resolvedToken.length > 0 ? resolvedToken : null
    };
  }

  private fetchInitialData(userId: string): void {
    let passengerInfoFull: any = null;
    this.apiService
      .getPassengerInfo(userId)
      .pipe(
        tap((response: any) => {
          passengerInfoFull = response;
          const apiLang = (response?.flight?.flight_search?.language || '').toString().toLowerCase();
          const lang = apiLang === 'en' ? 'en' : 'th';
          this.passDataService.setLanguage(lang);
          this.passDataService.setPassengerInfo(response.flight);
        }),
        switchMap(() => this.apiService.getPDPA(userId)),
        catchError((err) => {
          this.router.navigate(['/error'], { queryParams: { isNotFound: true }, replaceUrl: true });
          return of(null);
        })
      )
      .subscribe((pdpaResponse: any) => {
        if (!pdpaResponse) return; 
        if (pdpaResponse.consent) {
          const currentPath = (this.router.url || '').split('?')[0];
          const isPaymentRedirect = (
            currentPath === '/payment-page'
          );
          if (isPaymentRedirect) {
            return;
          }

          const hasBooked = (passengerInfoFull?.state === 'booked');
          const hasBookTimeout = (passengerInfoFull?.state === 'timeout');

          if (hasBooked) {
            this.router.navigate(['/payment-page']);
          } else if (hasBookTimeout) {
            this.router.navigate(['/error'], { queryParams: { isTimeout: true }, replaceUrl: true });
          } else {
            this.router.navigate(['/form']);
          }
        } else {
          this.router.navigate(['/pdpa']);
        }
      });
  }
}
