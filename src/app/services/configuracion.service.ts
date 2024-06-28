import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  httpOptions: any;
  path: any;
  appLang: string = 'es'; 

  constructor(private http: HttpClient) {
    this.path = environment.CONFIGURACION_SERVICE;
  }

  getMenu(roles: string, aplication: string, endpoint: string) {
    this.httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      }),
    };
    return this.http
      .get<any>(
        `${this.path}${endpoint}/${roles}/${aplication}`,
        this.httpOptions
      )
      .pipe(
        map((res) => {
          if (res.hasOwnProperty('Body')) {
            return res;
          } else {
            return res;
          }
        })
      );
  }

  getWithoutPath(endpoint: string) {
    this.httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      }),
    };
    return this.http.get<any>(`${endpoint}`, this.httpOptions).pipe(
      map((res) => {
        if (res && res.hasOwnProperty('Body')) {
          return res;
        } else {
          return res;
        }
      })
    );
  }

  setAppLang(lang: string) {
    this.appLang = lang;
  }

  getAppLang(): string {
    return this.appLang;
  }

  /**
   * Perform a POST http request
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post(endpoint: string, element: any) {
    this.httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      }),
    };
    return this.http.post<any>(
      `${this.path}${endpoint}`,
      element,
      this.httpOptions
    );
  }
}
