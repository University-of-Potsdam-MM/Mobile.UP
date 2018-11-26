import { Component, Output, EventEmitter, Input } from '@angular/core';
import { SettingsProvider } from '../../providers/settings/settings';

@Component({
  selector: 'campus-tab',
  templateUrl: 'campus-tab.html'
})
export class CampusTabComponent {

  currentCampus;

  @Input() passedLocation;
  @Output() campusChanged = new EventEmitter();

  constructor(private settingsProvider: SettingsProvider) {
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
