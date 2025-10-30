import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PassDataService } from '../../core/services/pass-data.service';

@Injectable()
export class HttpErrorInterceptorInterceptor implements HttpInterceptor {
  token = '';

  constructor(private router: Router, private passDataService: PassDataService  ) {
    this.passDataService.getToken().subscribe((token: string) => {
      this.token = token;
    });

  }  

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let authReq = request;
    // แนบ Authorization เฉพาะ request ที่เป็น internal (เช่น ไปยัง base path ของระบบ)
    // กรณี external (เช่น https://api.open-meteo.com, https://restcountries.com) จะไม่แต่ง header
    const isExternal = /^https?:\/\//i.test(request.url) && !/localhost:4000\/.+|uat-ddservices\.nokair\.com\//i.test(request.url);
    if (!isExternal && this.token) {
      authReq = request.clone({
        setHeaders: { Authorization: `Bearer ${this.token}` }
      });
    }
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);
        if (error.status === 500 || error.status === 422 || error.status === 404) {
          console.error('Server Error 500:', error);
          this.handleServerError(error);
          return throwError(() => new Error('error 500'));
        }
        return throwError(() => new Error('error 404'));
      })
    );
  }

  private handleServerError(error: HttpErrorResponse) {
    this.router.navigate(['/error'], { queryParams: { isError: true } });
  }
}


