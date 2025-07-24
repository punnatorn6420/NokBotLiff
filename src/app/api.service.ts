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
     "user_id": "U197dceb79bc625b5811cfa6174397c88"
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${"http://localhost:4000/api/liff/get-passenger-info"}`, body, { headers });
  }

  getSeatMap() {
    var journeyKey = "DMKCNX20250725010000THB:_DD13220250725:1664777";
    var fareKey = "DMKCNX20250725010000THB_148:URALIT00";
    const body = {
      journeyKey: journeyKey,
      fareKey: fareKey
    }
    const headers = new HttpHeaders().set('X-Api-Key', 'dev');
    return this.http.post(`${"http://localhost:4000/api/liff/retrieve-seat-map"}`, body, { headers });
  }
}
