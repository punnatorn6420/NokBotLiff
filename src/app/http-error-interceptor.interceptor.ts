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

@Injectable()
export class HttpErrorInterceptorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}  

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
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
