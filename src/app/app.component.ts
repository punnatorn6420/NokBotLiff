import { Component, EventEmitter, Output } from '@angular/core';
import { PassDataService } from './pass-data.service';
import { LiffService } from './liff.service';
import { ApiService } from './api.service';

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
    private apiService: ApiService
  ) {
    // this.passDataService.setLanguage('th');
  }

  ngOnInit() {
    this.apiService.getPassengerInfo().subscribe((response: any) => {
      console.log(response.flight);
      this.passDataService.setLanguage(response.flight.flight_search.language);
      this.passDataService.setPassengerInfo(response.flight);
    });
    // this.passDataService.getLanguage().subscribe(language => {
    //   this.language = language;
    // });

    // this.passDataService.setLanguage('th');

    // this.liffService.initializeLiff().then(() => {
    //   console.log('Liff initialized');
    //   if (this.liffService.isLoggedIn()) {
    //     this.liffService.getProfile().then(profile => {
    //       console.log('Profile:', profile);
    //     });
    //   } else {
    //     this.liffService.login();
    //   }
    // });
  }
}
