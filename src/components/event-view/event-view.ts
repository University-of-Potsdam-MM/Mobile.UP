import { Component, Input } from '@angular/core';

@Component({
  selector: 'event-view',
  templateUrl: 'event-view.html'
})
export class EventViewComponent {

  @Input() public event;
  @Input() public seperator;

  descriptionShown = false;
  pictureURL;

  constructor() {
  }

  ngOnInit() {
    if (this.event.Event.pic) {
      this.pictureURL = this.event.Event.pic;
    }
  }

  toggleDescription() {
    this.descriptionShown = !this.descriptionShown;
  }

}
