import { Component } from '@angular/core';
import { AbstractPage } from 'src/app/lib/abstract-page';

@Component({
  selector: 'app-lectures',
  templateUrl: './lectures.page.html',
  styleUrls: ['./lectures.page.scss'],
})
export class LecturesPage extends AbstractPage {

  constructor() {
    super({ requireNetwork: true });
  }

}
