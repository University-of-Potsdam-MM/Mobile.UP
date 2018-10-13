import { Component, Output, EventEmitter } from '@angular/core';
import { SettingsProvider } from '../../providers/settings/settings';

@Component({
  selector: 'campus-tab',
  templateUrl: 'campus-tab.html'
})
export class CampusTabComponent {

  currentCampus;

  @Output() campusChanged = new EventEmitter();

  constructor(private settingsProvider: SettingsProvider) {
  }

  ngOnInit() {
    this.initCampus();
  }

  async initCampus() {
    this.currentCampus = await this.settingsProvider.getSettingValue("campus");
    this.currentCampus = this.currentCampus.replace(" ","");
    this.changeCampus();
  }

  changeCampus() {
    this.campusChanged.emit(this.currentCampus);
  }

}
