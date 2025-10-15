import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // baseUrl = "https://uat-ddservices.nokair.com/botnoi-api/api/";
  baseUrl = "http://localhost:4000/api/";

  constructor(private http: HttpClient) { }

  setPDPA(userId: string, consent: boolean) {
    const body = {
      user_id: userId,
      consent: consent
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/set-pdpa-consent`, body, { headers });
  }
  getPDPA(userId: string) {
    const body = {
      user_id: userId
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/get-pdpa-consent`, body, { headers });
  }

  getRestcountries() {
    return this.http.get(`${"https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2"}`);
  }

  getPassengerInfo(userId: string) {
    const body = {
     "user_id": userId
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/get-passenger-info`, body, { headers });
  }

  getServiceBundle(userId: string, language: string, currency: string) {
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    const params = { user_id: userId, language, currency } as const;
    return this.http.get(`${this.baseUrl+'booking'}/list_service_bundle`, { headers, params });
  }

  getSeatMap(journeyKey?: string, fareKey?: string) {
    const body = {
      journeyKey: journeyKey,
      fareKey: fareKey
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/retrieve-seat-map`, body, { headers });
  }

  getPricingSummary(payload: any) {
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/pricing-summary-service`, payload, { headers });
  }

  createBooking(payload: any) {
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/get-create-booking`, payload, { headers });
  }

  retrieveBooking(recordLocator: string) {
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl+'liff'}/get-retrieve-booking`, { recordLocator }, { headers });
  }
}
