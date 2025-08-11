import { Component } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
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
  currentForm: FormGroup | null = null;

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
  dialCodeOptions: any[] = []; // Changed to any[] to accommodate flag, name, idd, displayText
    
  filteredNationalityOptions!: Observable<string[]>;
  filteredCountryOptions!: Observable<string[]>;
  filteredIssuedByOptions!: Observable<string[]>;
  filteredPhonePrefixOptions!: Observable<string[]>;
  filteredDialCodeOptions!: Observable<string[]>;

  needsSpecialAssistance: boolean = false;
  disabledVision: boolean = false;
  disabledHearing: boolean = false;
  monk: boolean = false;
  nun: boolean = false;
  pregnantWoman: boolean = false;
  wheelchairUser: boolean = false;
  unaccompaniedMinor: boolean = false;
  other: boolean = false;
  otherReason: string = '';

  constructor(private router: Router, 
    private dialog: MatDialog, 
    private route: ActivatedRoute,
    private apiService: ApiService, 
    private passDataService: PassDataService, 
    private translate: TranslateService) {
      // this.translate.setDefaultLang('th');
      // this.translate.use('th');
      this.route.queryParams.subscribe((params: any) => {
        this.selectedPassenger = params.passengerIndex+1;
        console.log("selectedPassenger",this.selectedPassenger);
      });
    }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // ตั้งค่าเริ่มต้นก่อน
    this.passDataService.getPassengerInfo().subscribe((data: any) => {
      const adults = data?.flight_search?.adults ?? 0;
      const children = data?.flight_search?.children ?? 0;
      const infants = data?.flight_search?.infants ?? 0;
      this.numberPassenger = Number(adults) + Number(children) + Number(infants);
      console.log("getPassengerInfo passenger-form", this.numberPassenger);
      this.numberPassengerArray = Array.from({length: this.numberPassenger}, (_, i) => i + 1);
      this.initializePassengerForms();
      
      // ตั้งค่า currentForm หลังจาก initializePassengerForms
      if (this.numberPassenger > 0) {
        this.currentForm = this.passengerForms[1];
        this.selectedPassenger = 1;
        this.setupAutocompleteFilters();
      }
    });

    // โหลดข้อมูลจาก service และโหลดข้อมูลเพียงครั้งเดียว
    this.passDataService.getFormData().subscribe((data: any) => {
      if (data && Object.keys(data).length > 0) {
        console.log("getFormData passenger-form",data);
        // มีข้อมูลจาก service - อัปเดตและโหลด
        this.passengersData = data;
        this.numberPassenger = Object.keys(this.passengersData).length;
        this.numberPassengerArray = Array.from({length: this.numberPassenger}, (_, i) => i + 1);
        this.initializePassengerForms();
        this.loadAllPassengerData(this.passengersData);
      } else {
        // ไม่มีข้อมูลจาก service - โหลดข้อมูลเริ่มต้น
        this.loadAllPassengerData(this.passengersData);
      }
    });

    // โหลดข้อมูลประเทศ
    this.apiService.getRestcountries().subscribe((res: any) => {
      this.convertRestcountries(res);
    });

    // ตั้งค่า autocomplete filters หลังจากโหลดข้อมูลเสร็จ
    setTimeout(() => {
      this.setupAutocompleteFilters();
    }, 1000);

    // ตั้งค่าภาษา
    // this.passDataService.getLanguage().subscribe(language => {
    //   this.switchLanguage(language as 'th' | 'en');
    // });
  }

  // switchLanguage(lang: 'th' | 'en') {
  //   this.translate.use(lang);
  // }

  convertRestcountries(res: any) {
    let _data: any[] = [];
    for (let i = 0; i < res.length; i++) {
      const country = res[i];
      const root = country.idd.root;
      const suffixes = country.idd.suffixes || [];
      
      // สร้างรายการรหัสประเทศทั้งหมด
      const allDialCodes: string[] = [];
      
      // กรณีพิเศษสำหรับ USA - แสดงแค่ root
      if (country.cca2 === 'US') {
        allDialCodes.push(root);
      } else {
        // ประเทศอื่นๆ - เพิ่มเฉพาะ root + suffixes ทุกตัว (ไม่รวม root เปล่าๆ)
        suffixes.forEach((suffix: string) => {
          allDialCodes.push(root + suffix);
        });
        
        // ถ้าไม่มี suffixes ให้เพิ่ม root เปล่าๆ
        if (suffixes.length === 0) {
          allDialCodes.push(root);
        }
      }
      
      // สร้างข้อมูลสำหรับแต่ละรหัสประเทศ
      allDialCodes.forEach(dialCode => {
        _data.push({
          flag: country.flags.png,
          name: country.name.common,
          idd: dialCode,
          displayText: `${country.name.common} (${dialCode})`
        });
      });
    }

    this.countryOptions = res.map((item: any) => item.name.common);
    this.issuedByOptions = res.map((item: any) => item.name.common);
    this.nationalityOptions = res.map((item: any) => item.name.common);
    
    // เก็บข้อมูล dialCode ทั้งหมด
    this.dialCodeOptions = _data;
  }

  // ปรับปรุงฟังก์ชัน extractDialCode
  extractDialCode(option: any): string {
    if (typeof option === 'string') {
      // กรณีที่ option เป็น string (backward compatibility)
      const colonIndex = option.indexOf(': ');
      if (colonIndex !== -1) {
        return option.substring(colonIndex + 2);
      }
      return option;
    }
    // กรณีที่ option เป็น object
    return option.idd;
  }

  // ปรับปรุงฟังก์ชัน getDisplayText
  getDisplayText(option: any): string {
    if (typeof option === 'string') {
      // กรณีที่ option เป็น string (backward compatibility)
      const colonIndex = option.indexOf(': ');
      if (colonIndex !== -1) {
        return option.substring(0, colonIndex);
      }
      return option;
    }
    // กรณีที่ option เป็น object
    return option.displayText;
  }

  // เพิ่มฟังก์ชันใหม่สำหรับดึง URL ของ flag
  getFlagUrl(option: any): string {
    if (typeof option === 'string') {
      // กรณีที่ option เป็น string (backward compatibility)
      const parts = option.split(': ');
      if (parts.length >= 3) {
        return parts[0]; // flag URL
      }
      return '';
    }
    // กรณีที่ option เป็น object
    return option.flag;
  }

  // สร้าง FormGroup สำหรับผู้โดยสารแต่ละคน
  private initializePassengerForms() {
    if (!this.numberPassengerArray || this.numberPassengerArray.length === 0) {
      console.error('numberPassengerArray is empty or undefined');
      return;
    }
    
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
          phoneNumber: new FormControl('', [Validators.required]),
          email: new FormControl('', [Validators.required, Validators.email]),
          needsSpecialAssistance: new FormControl(false),
          disabledVision: new FormControl(false),
          disabledHearing: new FormControl(false),
          monk: new FormControl(false),
          nun: new FormControl(false),
          pregnantWoman: new FormControl(false),
          wheelchairUser: new FormControl(false),
          unaccompaniedMinor: new FormControl(false),
          other: new FormControl(false),
          otherReason: new FormControl('')
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
          expireDate: new FormControl(null, [Validators.required]),
          needsSpecialAssistance: new FormControl(false),
          disabledVision: new FormControl(false),
          disabledHearing: new FormControl(false),
          monk: new FormControl(false),
          nun: new FormControl(false),
          pregnantWoman: new FormControl(false),
          // ไม่มี phonePrefix, phoneNumber, email สำหรับผู้โดยสารคนที่ 2+
          wheelchairUser: new FormControl(false),
          unaccompaniedMinor: new FormControl(false),
          other: new FormControl(false),
          otherReason: new FormControl('')
        });
      }
    }
    
    console.log('Passenger forms initialized:', this.passengerForms);
  }

  // ตั้งค่า autocomplete filters
  private setupAutocompleteFilters() {
    if (!this.currentForm) return;

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
  private _filterDialCode(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.dialCodeOptions.filter(option => {
      if (typeof option === 'string') {
        return option.toLowerCase().includes(filterValue);
      }
      return option.name.toLowerCase().includes(filterValue) || 
             option.idd.toLowerCase().includes(filterValue);
    });
  }

  // บันทึกข้อมูลผู้โดยสารปัจจุบัน
  private saveCurrentPassengerData() {
    console.log("saveCurrentPassengerData",this.currentForm);
    if (this.currentForm && this.currentForm.valid) {
      this.passengersData[this.selectedPassenger] = this.currentForm.value;
    }
  }

  // โหลดข้อมูลผู้โดยสาร
  private loadPassengerData(passengerNumber: number) {
    // อัปเดต FormGroup ปัจจุบัน
    this.currentForm = this.passengerForms[passengerNumber];
    
    if (!this.currentForm) {
      console.error(`Form for passenger ${passengerNumber} not found`);
      return;
    }
    
    const data = this.passengersData[passengerNumber];
    if (data) {
      this.currentForm.patchValue(data);
    }

    // อัปเดต autocomplete filters สำหรับ FormGroup ใหม่
    this.setupAutocompleteFilters();
  }

  // เพิ่มฟังก์ชันใหม่สำหรับโหลดข้อมูลผู้โดยสารทุกคน
  private loadAllPassengerData(data: any) {
    // โหลดข้อมูลผู้โดยสารทุกคน
    for (const passengerNumber of this.numberPassengerArray) {
      const _data = data[passengerNumber];
      if (_data && this.passengerForms[passengerNumber]) {
        this.passengerForms[passengerNumber].patchValue(_data);
      }
    }
    
    // ตั้งค่า currentForm เป็นผู้โดยสารคนแรก
    this.currentForm = this.passengerForms[1];
    this.selectedPassenger = 1;
    
    // ตรวจสอบว่า currentForm มีค่าหรือไม่
    if (!this.currentForm) {
      console.error('Form for passenger 1 not found');
      return;
    }
    
    // อัปเดต autocomplete filters
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
    return this.numberPassengerArray.every(passengerNumber => {
      const form = this.passengerForms[passengerNumber];
      return form && form.valid;
    });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // scroll to first error
  scrollToFirstError() {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('mat-error:not([style*="display: none"])');
      if (firstErrorElement) {
        const formField = firstErrorElement.closest('mat-form-field');
        if (formField) {
          const inputElement = formField.querySelector('input, mat-select, textarea');
          if (inputElement) {
            // scroll to input and focus
            inputElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            // focus at input
            (inputElement as HTMLElement).focus();
          } else {
            // if not found input, scroll to form-field
            formField.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }
      }
    }, 100);
  }

  // scroll to field error
  scrollToFieldError(fieldName: string) {
    setTimeout(() => {
      const formField = document.querySelector(`[formControlName="${fieldName}"]`)?.closest('mat-form-field');
      if (formField) {
        const inputElement = formField.querySelector('input, mat-select, textarea');
        if (inputElement) {
          inputElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          (inputElement as HTMLElement).focus();
        }
      }
    }, 100);
  }

  // next step
  nextStep() {
    this.saveCurrentPassengerData();
    if (!this.isAllPassengersValid()) {
      // find first passenger with error
      for (const passengerNumber of this.numberPassengerArray) {
        const form = this.passengerForms[passengerNumber];
        if (form && form.invalid) {
          // change to passenger with error
          this.selectPassenger(passengerNumber);
          form.markAllAsTouched();
          // scroll to first error
          this.scrollToFirstError();
          return;
        }
      }
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
        this.setPassengerData();
        this.router.navigate(['/select-seat']);
      }
    });
  }

  setPassengerData() {
    if (this.passengersData[1].dialCode === '') {
      this.passengersData[1].dialCode = '+66';
    }
    this.passDataService.setFormData(this.passengersData);
  }

  // check passenger valid
  checkPassengerValid(passenger: number) {
    const form = this.passengerForms[passenger];
    if (!form) {
      console.error(`Form for passenger ${passenger} not found`);
      return;
    }
    
    if (form.valid) {
      this.nextPassenger();
    } else {
      form.markAllAsTouched();
      this.scrollToFirstError();
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

  // check field valid
  isPassengerFieldValid(passenger: number, fieldName: string): boolean {
    const form = this.passengerForms[passenger];
    if (!form) return false;
    
    const control = form.get(fieldName);
    if (!control) return true; // if no control, consider it valid
    
    return !control.invalid || !control.touched;
  }

  // check if passenger has invalid and touched fields
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

  // toggle main assistance checkbox
  toggleMainAssistance() {
    if (!this.currentForm) return;
    
    const currentValue = this.currentForm.get('needsSpecialAssistance')?.value;
    this.currentForm.patchValue({
      needsSpecialAssistance: !currentValue
    });

    if (currentValue === false) {
      this.ClearAllSpecialAssistance();
    }
  }

  toggleOption(optionName: string) {
    if (!this.currentForm) return;
    
    const currentValue = this.currentForm.get(optionName)?.value;
    this.currentForm.patchValue({
      [optionName]: !currentValue
    });
  }

  ClearAllSpecialAssistance() {
    if (!this.currentForm) return;
    
    this.currentForm.patchValue({
      disabledVision: false,
      disabledHearing: false,
      monk: false,
      nun: false,
      pregnantWoman: false,
      wheelchairUser: false,
      unaccompaniedMinor: false,
      other: false,
      otherReason: ''
    });
  }

  validateAndScrollToError() {
    if (!this.currentForm) return;
    
    if (this.currentForm.invalid) {
      this.currentForm.markAllAsTouched();
      this.scrollToFirstError();
    }
  }

  validateFieldAndScroll(fieldName: string) {
    if (!this.currentForm) return;
    
    const control = this.currentForm.get(fieldName);
    if (control && control.invalid && control.touched) {
      this.scrollToFieldError(fieldName);
    }
  }

  onPhoneNumberInput(event: any) {
    if (!this.currentForm) return;
    
    const phoneControl = this.currentForm.get('phoneNumber');
    if (!phoneControl) return;
    
    let value = event.target.value;
    
    if (value.startsWith('0') && value.length > 1) {
      value = value.substring(1);
      phoneControl.setValue(value, { emitEvent: false });
    }
  }
}
