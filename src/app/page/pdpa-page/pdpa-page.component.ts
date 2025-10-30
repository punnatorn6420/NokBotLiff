import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PassDataService } from '../../core/services/pass-data.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-pdpa-page',
  templateUrl: './pdpa-page.component.html',
  styleUrls: ['./pdpa-page.component.scss']
})
export class PdpaPageComponent implements OnInit {
  isAccepted = false;
  userId = '';
  token = '';
  constructor(
    private router: Router, 
    private translate: TranslateService, 
    private passDataService: PassDataService,
    private apiService: ApiService) {
      this.passDataService.getUserId().subscribe((userId: string) => {
        this.userId = userId;
      });
  }

  onAcceptChange(event: Event) {
    this.isAccepted = (event.target as HTMLInputElement).checked;
  }

  ngOnInit() {
    this.passDataService.getToken().subscribe((token: string) => {
      this.token = token;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.passDataService.getLanguage().subscribe(language => {
      this.switchLanguage(language as 'th' | 'en');
    });
    setTimeout(() => {
      try {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } catch (error) {
        console.error('Error scrolling to top:', error);
      }
    }, 100);
  }

  switchLanguage(lang: 'th' | 'en') {
    this.translate.use(lang);
  }

  onConfirm() {
    this.apiService.setPDPA(this.userId, this.isAccepted).subscribe(() =>
      this.router.navigate(['/form'])
    );
  }
}
