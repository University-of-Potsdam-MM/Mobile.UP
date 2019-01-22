import { Component, Output, EventEmitter, Input } from '@angular/core';
import { SettingsProvider } from '../../providers/settings/settings';
import { Events } from 'ionic-angular';

@Component({
  selector: 'campus-tab',
  templateUrl: 'campus-tab.html'
})
export class CampusTabComponent {

  currentCampus;

  @Input() passedLocation;
  @Output() campusChanged = new EventEmitter();

  constructor(private settingsProvider: SettingsProvider, private swipeEvent: Events) {
    this.swipeEvent.subscribe('campus-swipe-to-right', (currentCampus) => {
      if (currentCampus == "NeuesPalais") {
        this.currentCampus = "Griebnitzsee";
      } else if (currentCampus == "Golm") {
        this.currentCampus = "NeuesPalais";
      }
    });

    this.swipeEvent.subscribe('campus-swipe-to-left', (currentCampus) => {
      if (currentCampus == "NeuesPalais") {
        this.currentCampus = "Golm";
      } else if (currentCampus == "Griebnitzsee") {
        this.currentCampus = "NeuesPalais";
      }
    });
  }

  ngOnInit() {
    this.initCampus();
  }

  async initCampus() {
    if (this.passedLocation) {
      switch (this.passedLocation) {
        case "1": {
          this.currentCampus = "NeuesPalais";
          break;
        }
        case "2": {
          this.currentCampus = "Golm";
          break;
        }
        case "3": {
          this.currentCampus = "Griebnitzsee";
        }
        default: {
          this.currentCampus = "Griebnitzsee";
        }
      }
    } else {
      this.currentCampus = await this.settingsProvider.getSettingValue("campus");
      this.currentCampus = this.currentCampus.replace(" ","");
    }
    this.changeCampus();
  }

  changeCampus() {
    this.campusChanged.emit(this.currentCampus);
  }

}
