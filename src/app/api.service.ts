import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl = "https://ddservices-uat.nokair.com/botnoi-api/api/liff";
  // baseUrl = "http://localhost:4000/api/liff";

  constructor(private http: HttpClient) { }

  setPDPA(userId: string, consent: boolean) {
    const body = {
      user_id: userId,
      consent: consent
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl}/set-pdpa-consent`, body, { headers });
  }
  getPDPA(userId: string) {
    const body = {
      user_id: userId
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl}/get-pdpa-consent`, body, { headers });
  }

  getRestcountries() {
    return this.http.get(`${"https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2"}`);
  }

  getPassengerInfo(userId: string) {
    const body = {
     "user_id": userId
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl}/get-passenger-info`, body, { headers });
  }

  getSeatMap(journeyKey?: string, fareKey?: string) {
    const body = {
      journeyKey: journeyKey,
      fareKey: fareKey
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${this.baseUrl}/retrieve-seat-map`, body, { headers });
  }
}
