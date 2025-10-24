import { Component, OnInit } from '@angular/core';
import { LiffService } from '../liff.service';
import { PassDataService } from '../pass-data.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-payment-status-success',
  templateUrl: './payment-status-success.component.html',
  styleUrls: ['./payment-status-success.component.scss']
})
export class PaymentStatusSuccessComponent implements OnInit {
  constructor(
    private liffService: LiffService,
    private passDataService: PassDataService,
    private apiService: ApiService,
  ) {}

  async ngOnInit() {
    const initialized = await this.liffService.initializeLiff();
    if (!initialized) {
      return;
    }

    const isInClient = this.liffService.isInClient();
    const os = this.liffService.getOS();

    let userId = '';
    const profile = await this.liffService.getProfile();
    if (profile && profile.userId) {
      userId = profile.userId;
      this.passDataService.setUserId(userId);
    }

    const message = 'เสร็จแล้ว';

    if (isInClient && (os === 'ios' || os === 'android')) {
      await this.liffService.sendMessage(message);
    } else {
      if (userId) {
        this.apiService.pushMessage(userId).subscribe();
      }
    }
  }
}
