import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl = "https://uat-ddservices.nokair.com/botnoi-api/api/";
  // baseUrl = "http://localhost:4000/api/";

  constructor(private http: HttpClient) { }

  setPDPA(userId: string, consent: boolean) {
    const body = {
      user_id: userId,
      consent: consent
    }
    // const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.baseUrl+'liff'}/set-pdpa-consent`, body);
  }
  getPDPA(userId: string) {
    const body = {
      user_id: userId
    }
    // const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.baseUrl+'liff'}/get-pdpa-consent`, body);
  }

  getRestcountries() {
    return this.http.get(`${"https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2"}`);
  }

  getPassengerInfo(userId: string) {
    const body = {
     "user_id": userId,
    }
    // const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.baseUrl+'liff'}/get-passenger-info`, body);
  }

  getServiceBundle(userId: string, language: string, currency: string) {
    //  const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    const params = { user_id: userId, language, currency } as const;
    return this.http.get(`${this.baseUrl+'liff'}/list_service_bundle`, {  params });
  }

  getSeatMap(journeyKey?: string, fareKey?: string) {
    const body = {
      journeyKey: journeyKey,
      fareKey: fareKey
    }
    // const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/retrieve-seat-map`, body);
  }

  getPricingSummary(payload: any) {
    // const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/pricing-summary-service`, payload);
  }

  createBooking(payload: any) {
    //  const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/get-create-booking`, payload);
  }

  retrieveBooking(recordLocator: string, language: string) {
    //  const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    const body = { recordLocator: recordLocator, preferredLanguage: language };
    return this.http.post(`${this.baseUrl+'liff'}/get-retrieve-booking`, body);
  }

  pushMessage(userId: string, pnr: string, language: string) {
    //  const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    const body = { user_id: userId, pnr: pnr, preferredLanguage: language };
    return this.http.post(`${this.baseUrl+'liff'}/push-message-payment-success`, body);
  }
}


