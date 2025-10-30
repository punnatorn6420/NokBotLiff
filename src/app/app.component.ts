import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PassDataService } from './core/services/pass-data.service';
import { LiffService } from './core/services/liff.service';
import { ApiService } from './core/services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'liff-nok-air';
  language: string = 'th';
  token: string = '';

  constructor(
    private passDataService: PassDataService,
    private liffService: LiffService,
    private apiService: ApiService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // this.passDataService.setLanguage('en');
    // this.translate.setDefaultLang('en');
    // this.translate.use('en');
  }

  ngOnInit() {
    const searchParams = new URLSearchParams(window.location.search);
    const uidFromQuery = searchParams.get('uid') || searchParams.get('UID');
    const tokenFromQuery = searchParams.get('token') || searchParams.get('TOKEN');
    const uidFromHrefMatch = window.location.href.match(/[?&]uid=([^&#]+)/i);
    const uidFromHref = uidFromHrefMatch ? decodeURIComponent(uidFromHrefMatch[1]) : null;
    const resolvedUid = (uidFromQuery || uidFromHref || '').trim();
    const resolvedToken = (tokenFromQuery || '').trim();
    if (resolvedToken.length > 0) {
      this.passDataService.setToken(resolvedToken);
      this.token=resolvedToken;
    }
    if (resolvedUid.length > 0) {
      const userId = resolvedUid;
      this.passDataService.setUserId(userId);
      this.fetchInitialData(userId);
      return;
    }

    this.liffService.initializeLiff().then(async (initialized) => {
      // if (!initialized) {
      //   const userId = 'U197dceb79bc625b5811cfa6174397c88';
      //   this.passDataService.setUserId(userId);
      //   this.fetchInitialData(userId);
      //   return;
      // }

      if (!this.liffService.isLoggedIn()) {
        await this.liffService.login();
        return;
      }

      const profile = await this.liffService.getProfile();
      const userId = profile?.userId;
      this.passDataService.setUserId(userId);
      this.fetchInitialData(userId);
    });
  }

   fetchInitialData(userId: string) {
    let passengerInfoFull: any = null;
    this.apiService
      .getPassengerInfo(userId)
      .pipe(
        tap((response: any) => {
          passengerInfoFull = response;
          console.log(response?.flight);
          const apiLang = (response?.flight?.flight_search?.language || '').toString().toLowerCase();
          const lang = apiLang === 'en' ? 'en' : 'th';
          this.passDataService.setLanguage(lang);
          this.passDataService.setPassengerInfo(response.flight);
        }),
        switchMap(() => this.apiService.getPDPA(userId)),
        catchError((err) => {
          this.router.navigate(['/error'], { queryParams: { isNotFound: true } });
          return of(null);
        })
      )
      .subscribe((pdpaResponse: any) => {
        if (!pdpaResponse) return; 
        if (pdpaResponse.consent) {
          const currentPath = (this.router.url || '').split('?')[0];
          console.log('currentPath', currentPath);
          const isPaymentRedirect = (
            currentPath === '/payment-page' ||
            currentPath === '/payment-status-fail'
          );
          if (isPaymentRedirect) {
            console.log('isPaymentRedirect');
            return;
          }

          const hasBooked = (passengerInfoFull?.state === 'booked') && !!passengerInfoFull?.pnr;
          const hasBookTimeout = (passengerInfoFull?.state === 'timeout');

          if (hasBooked) {
            this.router.navigate(['/payment-page']);
          }else if (hasBookTimeout) {
            this.router.navigate(['/error'], { queryParams: { isTimeout: true } });
          } else {
            this.router.navigate(['/form']);
          }
        } else {
          this.router.navigate(['/pdpa']);
        }
      });
  }
}
