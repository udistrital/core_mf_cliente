import { BehaviorSubject, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ImplicitAutenticationService } from './implicit_autentication.service';
import { AnyService } from './any.service';
import { decrypt, encrypt } from '../utils/util-encrypt';

const path = environment.TERCEROS_SERVICE;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user$ = new Subject<object>();
  private userSubject = new BehaviorSubject<object | null>(null);
  public tercero$ = this.userSubject.asObservable();
  public user: any;

  constructor(
    private anyService: AnyService,
    private autenticationService: ImplicitAutenticationService
  ) {
    const idToken = window.localStorage.getItem('id_token');
    if (idToken) {
      this.initializeUser();
    }
  }

  private async initializeUser() {
    try {
      const payload = this.autenticationService.getPayload();
      const docIdentificacion = await this.autenticationService.getDocument();
      const usuarioWSO2 = payload.sub || null;
      const correoUsuario = payload.email || null;
  
      let foundId = false;
  
      if (docIdentificacion) {
        foundId = await this.findByDocument(docIdentificacion, usuarioWSO2, correoUsuario);
      }
      if (usuarioWSO2 && !foundId) {
        foundId = await this.findByUserEmail(usuarioWSO2);
      }
      if (correoUsuario && !foundId) {
        await this.findByUserEmail(correoUsuario);
      }
    } catch (error) {
      console.error('Error inicializando usuario (core): ', error)
    }
    
  }

  private findByDocument(docIdentificacion: string, usuario: string | null, correo: string | null): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.anyService.get(path, `datos_identificacion?query=Activo:true,Numero:${docIdentificacion}&sortby=FechaCreacion&order=desc`)
        .subscribe((res: any) => {
          if (res && res.length && Object.keys(res[0]).length > 0) {
            this.user = this.extractTercero(res, usuario, correo) || res[0].TerceroId;
            if (this.user) {
              this.user.Documento = docIdentificacion;
              this.updateUser(this.user);
              resolve(true);
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        }, (error) => {
          reject(false);
        });
    });
  }

  private findByUserEmail(userEmail: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.anyService.get(path, `tercero?query=UsuarioWSO2:${userEmail}`)
        .subscribe((res: any) => {
          if (res && res.length && Object.keys(res[0]).length > 0) {
            this.user = res[0];
            this.updateUser(this.user);
            resolve(true);
          } else {
            resolve(false);
          }
        }, (error) => {
          reject(false);
        });
    });
  }

  private extractTercero(res: any[], usuario: string | null, correo: string | null): any {
    let tercero = res.find(item => item.TerceroId.UsuarioWSO2 === usuario) || res.find(item => item.TerceroId.UsuarioWSO2 === correo);
    return tercero?.TerceroId || null;
  }

  private updateUser(user: any) {
    this.user$.next(user);
    this.userSubject.next(user);
    const personaId = encrypt(user.Id.toString());
    window.localStorage.setItem('persona_id', personaId);
  }

  public getUsuario(): string {
    return window.localStorage.getItem('usuario')!;
  }

  public getPersonaId(): number {
    const id = decrypt(window.localStorage.getItem('persona_id'));
    return parseInt(id!, 10);
  }


  public getUser() {
    return this.tercero$;
  }
}
