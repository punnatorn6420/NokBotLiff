import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

// รูปแบบวันที่สำหรับไทย: dd/MM/yyyy
export const TH_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy',
  },
} as const;

@Injectable()
export class ThaiNativeDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      // รองรับ dd/MM/yyyy หรือ d/M/yyyy
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const [ddStr, mmStr, yyyyStr] = parts;
        const day = Number(ddStr);
        const month = Number(mmStr); // 1-12
        const year = Number(yyyyStr);
        if (
          Number.isInteger(day) && Number.isInteger(month) && Number.isInteger(year) &&
          day > 0 && month > 0 && month <= 12 && year > 0
        ) {
          // JS Date: เดือนเริ่มที่ 0
          const d = new Date(year, month - 1, day);
          // ตรวจสอบความถูกต้อง (เช่น 31/02 จะกลายเป็น Mar 03)
          if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
            return d;
          }
          return null;
        }
      }
      // fallback: ให้ NativeDateAdapter จัดการกรณีอื่นๆ
      const asDate = new Date(trimmed);
      return isNaN(asDate.getTime()) ? null : asDate;
    }
    return null;
  }

  override format(date: Date, displayFormat: Object): string {
    // แสดงผล dd/MM/yyyy ในช่อง input
    const day = this._to2(date.getDate());
    const month = this._to2(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private _to2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}


