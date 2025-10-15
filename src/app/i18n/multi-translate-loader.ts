import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TranslateLoader } from '@ngx-translate/core';

export interface TranslationResource {
  prefix: string;
  suffix: string;
}

export class MultiTranslateHttpLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    private resources: TranslationResource[]
  ) {}

  public getTranslation(lang: string): Observable<Record<string, unknown>> {
    const requests = this.resources.map(resource =>
      this.http
        .get<Record<string, unknown>>(`${resource.prefix}${lang}${resource.suffix}`)
        .pipe(
          // ถ้าไฟล์ไหนไม่พบ ให้ส่งอ็อบเจ็กต์ว่าง แทนที่จะ error ทั้งหมด
          catchError(() => of({}))
        )
    );

    return forkJoin(requests).pipe(
      map(parts => {
        const merged: Record<string, unknown> = {};
        for (const part of parts) {
          Object.assign(merged, part);
        }
        return merged;
      })
    );
  }
}


