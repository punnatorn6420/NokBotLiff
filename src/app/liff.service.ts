import { Injectable } from '@angular/core';
import liff from '@line/liff';

@Injectable({
  providedIn: 'root'
})
export class LiffService {
  private liffId: string = '2007963873-Nm3zln4x'; 

  constructor() { }

  async initializeLiff(): Promise<boolean> {
    try {
      await liff.init({ liffId: this.liffId });
      console.log('LIFF initialized successfully');
      return true;
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      return false;
    }
  }

  isInClient(): boolean {
    return liff.isInClient();
  }

  isLoggedIn(): boolean {
    return liff.isLoggedIn();
  }

  async login(): Promise<void> {
    if (!this.isLoggedIn()) {
      liff.login();
    }
  }

  async logout(): Promise<void> {
    if (this.isLoggedIn()) {
      liff.logout();
    }
  }

  async getProfile(): Promise<any> {
    if (this.isLoggedIn()) {
      return await liff.getProfile();
    }
    return null;
  }

  async sendMessage(message: string): Promise<void> {
    if (this.isInClient()) {
      await liff.sendMessages([{
        type: 'text',
        text: message
      }]);
    }
  }

  async closeWindow(): Promise<void> {
    if (this.isInClient()) {
      liff.closeWindow();
    }
  }

  async openWindow(url: string, external?: boolean): Promise<void> {
    if (this.isInClient()) {
      liff.openWindow({
        url: url,
        external: external || false
      });
    } else {
      window.open(url, '_blank');
    }
  }
}
