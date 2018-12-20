import { Component, Input } from '@angular/core';

@Component({
  selector: 'footer-disclaimer',
  templateUrl: 'footer-disclaimer.html'
})
export class FooterDisclaimerComponent {

  @Input() public disclaimerReference;
  @Input() public iconName;

  constructor() {
  }

}
