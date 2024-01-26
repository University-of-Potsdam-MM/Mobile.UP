import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import axios from 'axios';

const prefKey = 'MobileUP_DontShowBanner';

@Component({
  selector: 'app-info-banner',
  templateUrl: './info-banner.component.html',
  styleUrls: ['./info-banner.component.scss'],
})
export class InfoBannerComponent implements OnInit {
  public title = 'Hinweis1';
  public subtitle = 'Erklärung1';
  public description = 'Beschreibung1';

  constructor() {}

  ngOnInit() {
    this.checkPref().then((prefValue) => {
      console.log('render info banner: ' + prefValue);
      if (prefValue === true) {
        //this.closeCard();
      }
    });

    //fetch values of Hinweistext
    const fetchHinweisText = () => {
      axios
        .get(`http://n-apiprovider-01.rz.uni-potsdam.de:3000/api/hinweistext`)
        .then((response) => {
          const { title, subtitle, description } = response.data;
          this.title = title;
          this.subtitle = subtitle;
          this.description = description;
          if (title === '' && subtitle === '' && description === '') {
            this.closeCard();
          }
        })
        .catch((err) => {
          this.title = this.subtitle = this.description = '';
          this.closeCard();
          console.error(err);
        })
        .finally(() => {});
    };
    fetchHinweisText();
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
