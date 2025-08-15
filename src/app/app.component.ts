import { Component, EventEmitter, Output } from '@angular/core';
import { PassDataService } from './pass-data.service';
import { LiffService } from './liff.service';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

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
    private router: Router
  ) {
    // this.passDataService.setLanguage('th');
  }

  ngOnInit() {
    const userId = 'U197dceb79bc625b5811cfa6174397c86';
    this.passDataService.setUserId(userId);
    this.fetchInitialData(userId);

  //   this.liffService.initializeLiff().then(async (initialized) => {
  //     if (!initialized) {
  //       const userId = fallbackUserId;
  //       this.passDataService.setUserId(userId);
  //       this.fetchInitialData(userId);
  //       return;
  //     }

  //     if (!this.liffService.isLoggedIn()) {
  //       await this.liffService.login();
  //       return;
  //     }

  //     const profile = await this.liffService.getProfile();
  //     const userId = profile?.userId || fallbackUserId;
  //     this.passDataService.setUserId(userId);
  //     this.fetchInitialData(userId);
  //   });
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
      this.passDataService.setLanguage(response.flight.flight_search.language);
      this.passDataService.setPassengerInfo(response.flight);
    });
  }
}
