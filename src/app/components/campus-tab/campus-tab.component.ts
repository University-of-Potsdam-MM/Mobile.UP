import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Events } from '@ionic/angular';
import { SettingsService } from 'src/app/services/settings/settings.service';

@Component({
  selector: 'app-campus-tab',
  templateUrl: './campus-tab.component.html',
  styleUrls: ['./campus-tab.component.scss']
})
export class CampusTabComponent implements OnInit {

  currentCampus = 'Griebnitzsee';

  @Input() passedLocation;
  @Output() campusChanged = new EventEmitter();

  constructor(
    private settings: SettingsService,
    private swipeEvent: Events
  ) {
    this.swipeEvent.subscribe('campus-swipe-to-right', (currentCampus) => {
      if (currentCampus === 'NeuesPalais') {
        this.currentCampus = 'Griebnitzsee';
      } else if (currentCampus === 'Golm') {
        this.currentCampus = 'NeuesPalais';
      }
    });

    this.swipeEvent.subscribe('campus-swipe-to-left', (currentCampus) => {
      if (currentCampus === 'NeuesPalais') {
        this.currentCampus = 'Golm';
      } else if (currentCampus === 'Griebnitzsee') {
        this.currentCampus = 'NeuesPalais';
      }
    });
  }

  ngOnInit() {
    this.initCampus();
  }

  async initCampus() {
    if (this.passedLocation) {
      switch (this.passedLocation) {
        case '1': {
          this.currentCampus = 'NeuesPalais';
          break;
        }
        case '2': {
          this.currentCampus = 'Golm';
          break;
        }
        case '3': {
          this.currentCampus = 'Griebnitzsee';
          break;
        }
        default: {
          this.currentCampus = 'Griebnitzsee';
        }
      }
    } else {
      this.currentCampus = await this.settings.getSettingValue('campus');
      this.currentCampus = this.currentCampus.replace(' ', '');
    }
    this.changeCampus();
  }

  changeCampus(event?) {
    if (event) {
      this.currentCampus = event.detail.value;
    }

    this.campusChanged.emit(this.currentCampus);
  }

}
