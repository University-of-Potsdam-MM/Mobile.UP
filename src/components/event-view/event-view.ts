import { Component, Input } from '@angular/core';

@Component({
  selector: 'event-view',
  templateUrl: 'event-view.html'
})
export class EventViewComponent {

  @Input() public event;
  @Input() public seperator;

  descriptionShown = false;

  constructor() {
  }

  toggleDescription() {
    this.descriptionShown = !this.descriptionShown;
  }

}
