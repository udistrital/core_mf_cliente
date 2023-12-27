import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LoadComponent } from '../load/load.component';

@Component({
  selector: 'ng-uui-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone:true,
  imports:[LoadComponent]
})
export class LoginComponent implements OnInit {

  constructor() { }
  @Input('appname') appname: any;
  basePathAssets = 'https://pruebasassets.portaloas.udistrital.edu.co/'
  @Input('isloading') isloading: boolean = false;
  @Output('loginEvent') loginEvent: EventEmitter<any> = new EventEmitter();

  login() {
    this.isloading = true;
    this.loginEvent.next('clicked')
  }
  ngOnInit(): void {
  }

}
