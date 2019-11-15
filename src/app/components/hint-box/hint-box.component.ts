import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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
  secondHintTextI18nKey: string;

  @Input()
  disableTextCentering: boolean;
  constructor(
    public translate: TranslateService
  ) { }

}
