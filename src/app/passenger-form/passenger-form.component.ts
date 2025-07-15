import { Component } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { ApiService } from '../api.service';
import { PassDataService } from '../pass-data.service';
import { TranslateService } from '@ngx-translate/core';

interface PassengerData {
  selectedPrefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: Date | null;
  nationality: string;
  country: string;
  passportNumber: string;
  issuedBy: string;
  expireDate: Date | null;
  dialCode?: string;
  phoneNumber?: string;
  email?: string;
}

interface Restcountries {
  name: {
    common: string;
    official: string;
    nativeName: {
      [languageCode: string]: {
        official: string;
        common: string;
      };
    };
  };
  idd: {
    root: string;
    suffixes: string[];
  };
}


@Component({
  selector: 'app-passenger-form',
  templateUrl: './passenger-form.component.html',
  styleUrls: ['./passenger-form.component.scss']
})
export class PassengerFormComponent {
  selectedPassenger = 1;
  numberPassenger = 0;
  numberPassengerArray: number[] = [];
  
  // เก็บข้อมูลผู้โดยสารแต่ละคน
  passengersData: { [key: number]: PassengerData } = {};
  
  // เก็บ FormGroup สำหรับแต่ละผู้โดยสาร
  passengerForms: { [key: number]: FormGroup } = {};

  // FormGroup ปัจจุบัน
  currentForm!: FormGroup;

  prefix = [
    { value: 'MR', label: 'MR' },
    { value: 'MS', label: 'MS' },
    { value: 'MRS', label: 'MRS' },
    { value: 'MONK', label: 'MONK' },
    { value: 'MISS', label: 'MISS' },
  ];

  nationalityOptions: string[] = [];
  countryOptions: string[] = [];
  issuedByOptions: string[] = [];
  phonePrefixOptions: string[] = [];
  dialCodeOptions: string[] = [];
    
  filteredNationalityOptions!: Observable<string[]>;
  filteredCountryOptions!: Observable<string[]>;
  filteredIssuedByOptions!: Observable<string[]>;
  filteredPhonePrefixOptions!: Observable<string[]>;
  filteredDialCodeOptions!: Observable<string[]>;

  constructor(private router: Router, 
    private dialog: MatDialog, 
    private apiService: ApiService, 
    private passDataService: PassDataService, 
    private translate: TranslateService) {
      // this.translate.setDefaultLang('th');
      // this.translate.use('th');
    }

  ngOnInit() {
    this.passDataService.getFormData().subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        this.passengersData = data;
        this.numberPassenger = Object.keys(this.passengersData).length;
        this.numberPassengerArray = Array.from({length: this.numberPassenger}, (_, i) => i + 1);
        this.initializePassengerForms();
        this.loadPassengerData(1);
      }
    });

    this.apiService.getRestcountries().subscribe((res: any) => {
      this.convertRestcountries(res);
    });
    this.numberPassenger = 2;
    this.numberPassengerArray = Array.from({length: this.numberPassenger}, (_, i) => i + 1);

    this.initializePassengerForms();
    this.loadPassengerData(1);
    setTimeout(() => {
      this.setupAutocompleteFilters();
    }, 1000);

    this.passDataService.getLanguage().subscribe(language => {
      this.switchLanguage(language as 'th' | 'en');
    });
  }

  switchLanguage(lang: 'th' | 'en') {
    this.translate.use(lang);
  }

  convertRestcountries(res: any) {
    let _data = [];
    for (let i = 0; i < res.length; i++) {
      _data.push({
        name: res[i].name.common,
        idd: res[i].idd.root + res[i].idd.suffixes.join('')
      });
    }

    this.countryOptions = _data.map((item: any) => item.name);
    // this.phonePrefixOptions = _data.map((item: any) => item.idd);
    this.issuedByOptions = _data.map((item: any) => item.name);
    this.nationalityOptions = _data.map((item: any) => item.name);
    // this.dialCodeOptions = _data.map((item: any) => ({
    //   letter: item.name,
    //   names: [item.idd]  // เปลี่ยนเป็น array
    // }));
    this.dialCodeOptions = _data.map((item: any) => item.name + ': ' + item.idd);
    // console.log(this.dialCodeOptions);
    // console.log(this.phonePrefixOptions);
  }

  // เพิ่มฟังก์ชันใหม่สำหรับแยกรหัสประเทศ
  extractDialCode(fullText: string): string {
    const colonIndex = fullText.indexOf(': ');
    if (colonIndex !== -1) {
      return fullText.substring(colonIndex + 2); // ตัดเอาเฉพาะส่วนหลัง ": "
    }
    return fullText; // ถ้าไม่มี ":" ให้ส่งคืนข้อความเดิม
  }

  // เพิ่มฟังก์ชันสำหรับแสดงชื่อประเทศใน autocomplete
  getDisplayText(fullText: string): string {
    const colonIndex = fullText.indexOf(': ');
    if (colonIndex !== -1) {
      return fullText.substring(0, colonIndex); // ตัดเอาเฉพาะส่วนก่อน ": "
    }
    return fullText;
  }

  // สร้าง FormGroup สำหรับผู้โดยสารแต่ละคน
  private initializePassengerForms() {
    for (const passengerNumber of this.numberPassengerArray) {
      if (passengerNumber === 1) {
        this.passengerForms[passengerNumber] = new FormGroup({
          selectedPrefix: new FormControl('', [Validators.required]),
          firstName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          middleName: new FormControl('', [Validators.pattern(/^[a-zA-Z\s]+$/)]),
          lastName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          birthDate: new FormControl(null, [Validators.required, this.minAgeValidator(18)]),
          nationality: new FormControl('', [Validators.required]),
          country: new FormControl('', [Validators.required]),
          passportNumber: new FormControl('', [Validators.required]),
          issuedBy: new FormControl('', [Validators.required]),
          expireDate: new FormControl(null, [Validators.required]),
          dialCode: new FormControl(''),
          phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
          email: new FormControl('', [Validators.required, Validators.email])
        });
      } else {
        // ผู้โดยสารคนที่ 2+ - ไม่ต้องกรอก contact (ไม่มี FormControl สำหรับ contact)
        this.passengerForms[passengerNumber] = new FormGroup({
          selectedPrefix: new FormControl('', [Validators.required]),
          firstName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          middleName: new FormControl('', [Validators.pattern(/^[a-zA-Z\s]+$/)]),
          lastName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
          birthDate: new FormControl(null, [Validators.required]),
          nationality: new FormControl('', [Validators.required]),
          country: new FormControl('', [Validators.required]),
          passportNumber: new FormControl('', [Validators.required]),
          issuedBy: new FormControl('', [Validators.required]),
          expireDate: new FormControl(null, [Validators.required])
          // ไม่มี phonePrefix, phoneNumber, email สำหรับผู้โดยสารคนที่ 2+
        });
      }
    }
  }

  // ตั้งค่า autocomplete filters
  private setupAutocompleteFilters() {
    this.filteredNationalityOptions = this.currentForm.get('nationality')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterNationality(value || '')),
    );

    this.filteredCountryOptions = this.currentForm.get('country')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCountry(value || '')),
    );

    this.filteredIssuedByOptions = this.currentForm.get('issuedBy')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterIssuedBy(value || '')),
    );

    // เฉพาะผู้โดยสารคนที่ 1 เท่านั้นที่มี phonePrefix
    if (this.selectedPassenger === 1) {
      // this.filteredPhonePrefixOptions = this.currentForm.get('phonePrefix')!.valueChanges.pipe(
      //   startWith(''),
      //   map(value => this._filterPhone(value || '')),
      // );

      this.filteredDialCodeOptions = this.currentForm.get('dialCode')!.valueChanges.pipe(
        startWith(''),
        map(value => {
          const stringValue = typeof value === 'string' ? value : '';
          return this._filterDialCode(stringValue);
        }),
      );
    }

    // this.filteredDialCodeOptions = this.currentForm.get('dialCode')!.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filterDialCode(value || '')),
    // );
  }

  private _filterNationality(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.nationalityOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterCountry(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countryOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterIssuedBy(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.issuedByOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  // private _filterPhone(value: string): string[] {
  //   const filterValue = value.toLowerCase();
  //   return this.phonePrefixOptions.filter(option => option.toLowerCase().includes(filterValue));
  // }

  // private _filterDialCode(value: any): { letter: string; names: string[] }[] {
  //   const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
  //   return this.dialCodeOptions.filter(option => 
  //     option.letter.toLowerCase().includes(filterValue) || 
  //     option.names.some(name => name.includes(filterValue))
  //   );
  // }
  private _filterDialCode(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.dialCodeOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  // บันทึกข้อมูลผู้โดยสารปัจจุบัน
  private saveCurrentPassengerData() {
    if (this.currentForm) {
      this.passengersData[this.selectedPassenger] = this.currentForm.value;
    }
  }

  // โหลดข้อมูลผู้โดยสาร
  private loadPassengerData(passengerNumber: number) {
    // อัปเดต FormGroup ปัจจุบัน
    this.currentForm = this.passengerForms[passengerNumber];
    
    const data = this.passengersData[passengerNumber];
    if (data && this.currentForm) {
      this.currentForm.patchValue(data);
    }

    // อัปเดต autocomplete filters สำหรับ FormGroup ใหม่
    this.setupAutocompleteFilters();
  }

  // // ตรวจสอบ validation ของผู้โดยสารปัจจุบัน
  // isCurrentPassengerValid(): boolean {
  //   return this.currentForm ? this.currentForm.valid : false;
  // }

  // // ตรวจสอบ validation ของผู้โดยสารทุกคน
  // areAllPassengersValid(): boolean {
  //   return this.numberPassengerArray.every(passengerNumber => this.passengerForms[passengerNumber]?.valid);
  // }

  isAllPassengersValid(): boolean {
    return this.numberPassengerArray.every(passengerNumber => this.passengerForms[passengerNumber]?.valid);
  }

  selectPassenger(passenger: number) {
    // บันทึกข้อมูลผู้โดยสารปัจจุบันก่อนเปลี่ยน
    this.saveCurrentPassengerData();
    
    // เปลี่ยนไปยังผู้โดยสารที่เลือก
    this.selectedPassenger = passenger;
    
    // โหลดข้อมูลผู้โดยสารที่เลือก
    this.loadPassengerData(passenger);
  }

  nextPassenger() {
    this.saveCurrentPassengerData();
    if (this.selectedPassenger < this.numberPassenger) {
      this.selectedPassenger++;
      this.loadPassengerData(this.selectedPassenger);
    }
  }

  nextStep() {
    console.log(this.passengerForms[this.selectedPassenger]);
    console.log(this.passengerForms);
    this.saveCurrentPassengerData();
    if (!this.isAllPassengersValid()) {
      return;
    }
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '350px',
      disableClose: true,
      data: {
        isDialog: 'alert_checkdata'
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result.result === 'confirm') {
        this.passDataService.setFormData(this.passengersData);
        this.router.navigate(['/select-seat']);
        // if (this.selectedPassenger < this.numberPassenger) {
        //   this.selectedPassenger++;
        //   this.loadPassengerData(this.selectedPassenger);
        // } else {
        //   this.router.navigate(['/seat']);
        // }
      }
    });
  }

  checkPassengerValid(passenger: number) {
    if (this.passengerForms[passenger].valid) {
      this.nextPassenger();
    } else {
      this.passengerForms[passenger].markAllAsTouched();
    }
  }

  minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const birthDate = new Date(control.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= minAge ? null : { minAge: true };
    };
  }

  // isAnyFieldFilled(passenger: any): boolean {
  //   const controls = this.passengerForms[passenger].controls;
  //   return Object.values(controls).some(control => !!control.value);
  // }

  // เพิ่มฟังก์ชันใหม่สำหรับตรวจสอบ field ที่จำเป็นแต่ละตัว
  isPassengerFieldValid(passenger: number, fieldName: string): boolean {
    const form = this.passengerForms[passenger];
    if (!form) return false;
    
    const control = form.get(fieldName);
    if (!control) return true; // ถ้าไม่มี control ให้ถือว่าถูกต้อง
    
    return !control.invalid || !control.touched;
  }

  // ตรวจสอบว่าผู้โดยสารมี field ที่ invalid และ touched หรือไม่
  hasInvalidTouchedFields(passenger: number): boolean {
    const form = this.passengerForms[passenger];
    if (!form) return false;
    
    const requiredFields = passenger === 1 
      ? ['selectedPrefix', 'firstName', 'lastName', 'birthDate', 'nationality', 'country', 'passportNumber', 'issuedBy', 'expireDate', 'phoneNumber', 'email']
      : ['selectedPrefix', 'firstName', 'lastName', 'birthDate', 'nationality', 'country', 'passportNumber', 'issuedBy', 'expireDate'];
    
    return requiredFields.some(fieldName => {
      const control = form.get(fieldName);
      return control && control.invalid && control.touched;
    });
  }

  trackGroup(index: number, group: { letter: string; names: string[] }): string {
    return group.letter;
  }

  trackName(index: number, name: string): string {
    return name;
  }
}
