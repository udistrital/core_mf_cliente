import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LoadComponent } from '../load/load.component';
import { getSharedAssetUrl } from '../../single-spa/shared-asset-url';

@Component({
  selector: 'ng-uui-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [LoadComponent],
})
export class LoginComponent implements OnInit {
  @Input('appname') appname: any;
  basePathAssets = getSharedAssetUrl();
  @Input('isloading') isloading: boolean = false;
  @Output('loginEvent') loginEvent: EventEmitter<any> = new EventEmitter();
  constructor() {}
  login() {
    this.isloading = true;
    this.loginEvent.next('clicked');
  }
  ngOnInit(): void {}
}
