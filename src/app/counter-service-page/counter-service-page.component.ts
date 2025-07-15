import { Component, ElementRef, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-counter-service-page',
  templateUrl: './counter-service-page.component.html',
  styleUrls: ['./counter-service-page.component.scss']
})
export class CounterServicePageComponent {
  @ViewChild('screenshotContainer', { static: false }) screenshotContainer!: ElementRef;

  async saveImage() {
    if (!this.screenshotContainer) {
      console.error('Screenshot container not found');
      return;
    }

    try {
      const element = this.screenshotContainer.nativeElement;
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `nokair-booking-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error generating screenshot:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกภาพ');
    }
  }
}
