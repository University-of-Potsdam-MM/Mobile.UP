import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hint-box',
  templateUrl: './hint-box.component.html',
  styleUrls: ['./hint-box.component.scss']
})
export class HintBoxComponent {

  @Input()
  hintTypeI18nKey: string;

  @Input()
  hintTextI18nKey: string;

  @Input()
  hintIcon = 'warning';
  constructor() { }

}
