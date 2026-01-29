import { Injectable } from '@angular/core';
import liff from '@line/liff';

@Injectable({
  providedIn: 'root'
})
export class LiffService {
  private readonly liffId: string = '2007963873-Nm3zln4x';
  constructor() { }

  async initializeLiff(): Promise<boolean> {
    try {
      await liff.init({ liffId: this.liffId });
      return true;
    } catch (error) {
      return false;
    }
  }

  public isInClient(): boolean {
    return liff.isInClient();
  }

  public isLoggedIn(): boolean {
    return liff.isLoggedIn();
  }

  public async login(token?: string): Promise<void> {
    if (this.isLoggedIn()) return;

    const url = new URL(window.location.href);
    const trimmedToken = (token || '').trim();
    if (trimmedToken.length > 0) {
      url.searchParams.set('token', trimmedToken);
    } else {
      url.searchParams.delete('token');
    }

    liff.login({ redirectUri: url.toString() });
  }

  public logout(): void {
    if (!this.isLoggedIn()) return;
    liff.logout();
  }

  public async getProfile(): Promise<any> {
    if (!this.isLoggedIn()) return null;
    return await liff.getProfile();
  }

  public getOS(): 'ios' | 'android' | 'web' {
    return liff.getOS() as 'ios' | 'android' | 'web';
  }

  public async sendMessage(message: string): Promise<void> {
    if (!this.isInClient()) return;
    await liff.sendMessages([{ type: 'text', text: message }]);
  }

  public closeWindow(): void {
    if (!this.isInClient()) return;
    liff.closeWindow();
  }

  public openWindow(url: string, external: boolean = false): void {
    if (this.isInClient()) {
      liff.openWindow({ url, external });
      return;
    }
    window.open(url, '_blank');
  }
}


