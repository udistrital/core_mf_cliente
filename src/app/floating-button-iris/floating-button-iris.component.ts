import { Component } from '@angular/core';
import { assetUrl } from '../../single-spa/asset-url';

@Component({
  selector: 'app-floating-button-iris',
  standalone: true,
  imports: [],
  templateUrl: './floating-button-iris.component.html',
  styleUrl: './floating-button-iris.component.scss'
})
export class FloatingButtonIrisComponent {
  imagenIris = assetUrl('images/apoyo-tecnico.png');
}
