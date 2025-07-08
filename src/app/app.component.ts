import { Component, EventEmitter, Output } from '@angular/core';
import { PassDataService } from './pass-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'liff-nok-air';
  language: string = 'th';

  constructor(private passDataService: PassDataService) {
    this.passDataService.setLanguage('th');
  }

  ngOnInit() {
    this.passDataService.getLanguage().subscribe(language => {
      this.language = language;
    });
  }
}
