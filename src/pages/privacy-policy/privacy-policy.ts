import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { IConfig } from '../../library/interfaces';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-privacy-policy',
  templateUrl: 'privacy-policy.html',
})
export class PrivacyPolicyPage {

  config:IConfig;
  privacyDE;
  privacyEN;
  lang;

  constructor(public navCtrl: NavController, public navParams: NavParams, private translate: TranslateService) {
  }

  ngOnInit() {
    this.config = this.navParams.data.config;
    this.lang = this.translate.currentLang;
    this.privacyDE = this.config.policies.privacyTemplateDE;
    this.privacyEN = this.config.policies.privacyTemplateEN;
  }

}
