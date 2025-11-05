import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PassDataService {
  private readonly formDataSubject = new BehaviorSubject<any>(null);
  private readonly languageSubject = new BehaviorSubject<string>('th');
  private readonly seatDataSubject = new BehaviorSubject<any>(null);
  private readonly passengerInfoSubject = new BehaviorSubject<any>(null);
  private readonly totalPriceSubject = new BehaviorSubject<number>(0);
  private readonly userIdSubject = new BehaviorSubject<string>('');
  private readonly recordLocatorSubject = new BehaviorSubject<string>('');
  private readonly tokenSubject = new BehaviorSubject<string>('');
  private readonly passengerInfoPaymentSubject = new BehaviorSubject<any>(null);
  constructor() { }

  setPassengerInfo(data: any): void {
    this.passengerInfoSubject.next(data);
  }

  getPassengerInfo(): Observable<any> {
    return this.passengerInfoSubject.asObservable();
  }

  setPassengerInfoPayment(data: any): void {
    this.passengerInfoPaymentSubject.next(data);
  }

  getPassengerInfoPayment(): Observable<any> {
    return this.passengerInfoPaymentSubject.asObservable();
  }

  // ใช้ดึงค่าปัจจุบันของ passenger info (รวม state/pnr)
  getPassengerInfoPaymentData(): any {
    return this.passengerInfoPaymentSubject.value;
  }

  setLanguage(language: string): void {
    this.languageSubject.next(language);
  }

  getLanguage(): Observable<string> {
    return this.languageSubject.asObservable();
  }

  setFormData(data: any): void {
    this.formDataSubject.next(data);
  }

  getFormData(): Observable<any> {
    return this.formDataSubject.asObservable();
  }

  setSeatData(data: any): void {
    this.seatDataSubject.next(data);
  }

  getSeatData(): Observable<any> {
    return this.seatDataSubject.asObservable();
  }

  // เพิ่มฟังก์ชันสำหรับดึงข้อมูล flight data
  getFlightData(): any {
    // หมายเหตุ: ชื่อเมธอดนี้คงไว้เพื่อความเข้ากันได้ย้อนหลัง คืนค่าปัจจุบันของ passengerInfo
    return this.passengerInfoSubject.value;
  }

  setTotalPrice(totalPrice: number): void {
    this.totalPriceSubject.next(totalPrice);
  }

  getTotalPrice(): Observable<number> {
    return this.totalPriceSubject.asObservable();
  }

  setUserId(userId: string): void {
    this.userIdSubject.next(userId);
  }

  getUserId(): Observable<string> {
    return this.userIdSubject.asObservable();
  }

  setRecordLocator(recordLocator: string): void {
    this.recordLocatorSubject.next(recordLocator);
  }

  getRecordLocator(): Observable<string> {
    return this.recordLocatorSubject.asObservable();
  }

  setToken(token: string): void {
    this.tokenSubject.next(token);
  }

  getToken(): Observable<string> {
    return this.tokenSubject.asObservable();
  }
}


