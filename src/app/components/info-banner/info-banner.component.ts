import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const prefKey = 'MobileUP_DontShowBanner';

@Component({
  selector: 'app-info-banner',
  templateUrl: './info-banner.component.html',
  styleUrls: ['./info-banner.component.scss'],
})
export class InfoBannerComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    this.checkPref().then((prefValue) => {
      console.log('render info banner: ' + prefValue);
      if (prefValue === true) {
        this.closeCard();
      }
    });
  }

  closeCard(): void {
    document.querySelector('#info-banner-card').innerHTML = '';
    this.setPref(true);
  }

  setPref = async (v: boolean) => {
    await Preferences.set({
      key: prefKey,
      value: String(v),
    });
  };

  checkPref = async (): Promise<boolean> => {
    const { value } = await Preferences.get({ key: prefKey });
    console.log(`Pref is ${value}!`);
    return value === 'true';
  };

  removePref = async () => {
    await Preferences.remove({ key: prefKey });
  };
}
