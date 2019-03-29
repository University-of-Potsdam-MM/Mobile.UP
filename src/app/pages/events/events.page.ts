import { Component, OnInit } from '@angular/core';
import { AbstractPage } from 'src/app/lib/abstract-page';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
})
export class EventsPage extends AbstractPage implements OnInit {

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
