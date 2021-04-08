import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer-disclaimer',
  templateUrl: './footer-disclaimer.component.html',
  styleUrls: ['./footer-disclaimer.component.scss'],
})
export class FooterDisclaimerComponent {
  @Input() public disclaimerReference;
  @Input() public iconName;
}
