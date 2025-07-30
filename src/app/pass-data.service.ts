import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PassDataService {
  private formData = new BehaviorSubject<any>(null);
  private language = new BehaviorSubject<string>('th');
  private seatData = new BehaviorSubject<any>(null);
  private passengerInfo = new BehaviorSubject<any>(null);
  private totalPrice = new BehaviorSubject<number>(0);
  constructor() { }

  setPassengerInfo(data: any) {
    this.passengerInfo.next(data);
  }

  getPassengerInfo() {
    return this.passengerInfo.asObservable();
  }

  setLanguage(language: string) {
    this.language.next(language);
  }

  getLanguage() {
    return this.language.asObservable();
  }

  setFormData(data: any) {
    this.formData.next(data);
  }

  getFormData() {
    return this.formData.asObservable();
  }

  setSeatData(data: any) {
    this.seatData.next(data);
  }

  getSeatData() {
    return this.seatData.asObservable();
  }

  // เพิ่มฟังก์ชันสำหรับดึงข้อมูล flight data
  getFlightData(): any {
    return this.passengerInfo.value;
  }

  setTotalPrice(totalPrice: number) {
    this.totalPrice.next(totalPrice);
  }

  getTotalPrice() {
    return this.totalPrice.asObservable();
  }
}
