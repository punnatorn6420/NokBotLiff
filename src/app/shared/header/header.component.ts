import { Component, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PassDataService } from '../../core/services/pass-data.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() currentStep: number = 1; 

  constructor(private translate: TranslateService, private passDataService: PassDataService) {
    this.passDataService.getLanguage().subscribe(language => {
      this.switchLanguage(language as 'th' | 'en');
    });
  }

  switchLanguage(lang: 'th' | 'en') {
    this.translate.use(lang);
  }
}
