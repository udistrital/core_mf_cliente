import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { RequestManager } from './request.service';

const httpOptions = {
    headers: new HttpHeaders({
        'Accept': 'application/json',
    }),
}

@Injectable({
  providedIn: 'root',
})
export class AgoraService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('AGORA_SERVICE');
  }
  get(endpoint: string) {
    this.requestManager.setPath('AGORA_SERVICE');
    return this.requestManager.get(endpoint);
  }
  post(endpoint: string, element: any) {
    this.requestManager.setPath('AGORA_SERVICE');
    return this.requestManager.post(endpoint, element);
  }
  put(endpoint: string, element: { Id: any; }) {
    this.requestManager.setPath('AGORA_SERVICE');
    return this.requestManager.put(endpoint, element);
  }
  delete(endpoint: string, element: { Id: any; }) {
    this.requestManager.setPath('AGORA_SERVICE');
    return this.requestManager.delete(endpoint, element.Id);
  }
}
