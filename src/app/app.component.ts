import { Component, EventEmitter, Output } from '@angular/core';
import { PassDataService } from './pass-data.service';
import { LiffService } from './liff.service';

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
    private liffService: LiffService
  ) {
    this.passDataService.setLanguage('th');
  }

  ngOnInit() {
    this.passDataService.getLanguage().subscribe(language => {
      this.language = language;
    });

    this.liffService.initializeLiff().then(() => {
      console.log('Liff initialized');
      if (this.liffService.isLoggedIn()) {
        this.liffService.getProfile().then(profile => {
          console.log('Profile:', profile);
        });
      } else {
        this.liffService.login();
      }
    });
  }
}
