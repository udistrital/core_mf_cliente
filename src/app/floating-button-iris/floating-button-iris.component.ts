import { Component } from '@angular/core';

@Component({
  selector: 'app-floating-button-iris',
  standalone: true,
  imports: [],
  templateUrl: './floating-button-iris.component.html',
  styleUrl: './floating-button-iris.component.scss'
})
export class FloatingButtonIrisComponent {
  // imagenIris = window.__INJECTED_PUBLIC_PATH_BY_SINGLE_SPA__ + 'assets/images/apoyo-tecnico.png';
  imagenIris = '../../assets/images/apoyo-tecnico.png';
}
