import {Component, Input, OnInit} from '@angular/core';

/**
 * Generated class for the HintComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'hint',
  templateUrl: 'hint.html'
})
export class HintComponent implements  OnInit {

  @Input()
  hintTypeI18nKey: string;

  @Input()
  hintTextI18nKey: string;

  @Input()
  hintIcon:string = "warning";

  constructor() {}

  ngOnInit(){}

}
