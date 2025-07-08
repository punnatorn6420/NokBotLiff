import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PassDataService {
  private formData = new BehaviorSubject<any>(null);
  private language = new BehaviorSubject<string>('th');
  constructor() { }

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
}
