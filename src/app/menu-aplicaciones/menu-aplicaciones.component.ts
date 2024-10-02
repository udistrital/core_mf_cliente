import { Component, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { MenuAplicacionesService } from '../services/menuAplicaciones.service';
import {  AsyncPipe } from "@angular/common";


@Component({
  selector: 'ng-uui-menu-aplicaciones',
  templateUrl: './menu-aplicaciones.component.html',
  styleUrls: ['./menu-aplicaciones.component.scss'],
  standalone:true,
  schemas:[NO_ERRORS_SCHEMA],
  imports:[AsyncPipe]
})
export class MenuAplicacionesComponent implements OnInit {

  activo: any;
  basePathAssets = 'https://pruebasassets.portaloas.udistrital.edu.co/'

  constructor( public menuService: MenuAplicacionesService) {

  }

  // tslint:disable-next-line: typedef
  redirect(link:any) {
    window.open(link, '_blank');
    // if (link.indexOf(path_sub) === -1) {
    //   window.open(link, '_blank');
    // } else {
    //   this.router.navigate([link.substring(link.indexOf('#') + 1)]);
    // }
  }



  ngOnInit(): void {
    this.menuService.activo$
    .subscribe((isActive: any) => {
      const { activo } = isActive;
      this.activo = activo;
    });
  }


}
