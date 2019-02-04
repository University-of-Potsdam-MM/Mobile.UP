import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams
} from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LegalNoticePage } from '../legal-notice/legal-notice';
import { PrivacyPolicyPage } from '../privacy-policy/privacy-policy';
import { TermsOfUsePage } from '../terms-of-use/terms-of-use';
import { IConfig } from '../../library/interfaces';

@IonicPage()
@Component({
  selector: 'page-impressum',
  templateUrl: 'impressum.html',
})
export class ImpressumPage {

  config;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private storage: Storage) {}

    ngOnInit() {
      this.storage.get("config").then((config:IConfig) => {
        this.config = config;
      });
    }

    openPage(page) {
      if (page == "LegalNoticePage") {
        this.navCtrl.push(LegalNoticePage, { 'config': this.config });
      } else if (page == "PrivacyPolicyPage") {
        this.navCtrl.push(PrivacyPolicyPage, { 'config': this.config });
      } else {
        this.navCtrl.push(TermsOfUsePage, { 'config': this.config });
      }
    }
}