import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PassDataService } from './pass-data.service';
import { LiffService } from './liff.service';
import { ApiService } from './api.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'liff-nok-air';
  language: string = 'th';

  constructor(
    private passDataService: PassDataService,
    private liffService: LiffService,
    private apiService: ApiService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // this.passDataService.setLanguage('th');
  }

  ngOnInit() {
    this.translate.setDefaultLang('th');
    this.translate.use('th');
    const searchParams = new URLSearchParams(window.location.search);
    const uidFromQuery = searchParams.get('uid') || searchParams.get('UID');
    const uidFromHrefMatch = window.location.href.match(/[?&]uid=([^&#]+)/i);
    const uidFromHref = uidFromHrefMatch ? decodeURIComponent(uidFromHrefMatch[1]) : null;
    const resolvedUid = (uidFromQuery || uidFromHref || '').trim();

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
    this.apiService.getPDPA(userId).subscribe((response: any) => {
      console.log(response);
      if (response.consent) {
        this.router.navigate(['/form']);
      }
      else {
        this.router.navigate(['/pdpa']);
      }
    });

    this.apiService.getPassengerInfo(userId).subscribe((response: any) => {
      console.log(response.flight);
      const apiLang = (response?.flight?.flight_search?.language || '').toString().toLowerCase();
      const lang = apiLang === 'en' ? 'en' : 'th';
      this.passDataService.setLanguage(lang);
      this.passDataService.setPassengerInfo(response.flight);
    });
  }
}
