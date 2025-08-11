import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getRestcountries() {
    return this.http.get(`${"https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2"}`);
  }

  getPassengerInfo() {
    const body = {
     "user_id": "U197dceb79bc625b5811cfa6174397c86"
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${"http://localhost:4000/api/liff/get-passenger-info"}`, body, { headers });
  }

  getSeatMap(journeyKey?: string, fareKey?: string) {
    const body = {
      journeyKey: journeyKey,
      fareKey: fareKey
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${"http://localhost:4000/api/liff/retrieve-seat-map"}`, body, { headers });
  }
}
