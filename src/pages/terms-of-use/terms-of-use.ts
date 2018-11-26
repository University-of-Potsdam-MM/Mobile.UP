import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { IConfig } from '../../library/interfaces';

@IonicPage()
@Component({
  selector: 'page-terms-of-use',
  templateUrl: 'terms-of-use.html',
})
export class TermsOfUsePage {

  config:IConfig;
  termsDE;
  termsEN;
  lang;

  constructor(public navCtrl: NavController, public navParams: NavParams, private translate: TranslateService) {
  }

  ngOnInit() {
    this.config = this.navParams.data.config;
    this.lang = this.translate.currentLang;
    this.termsDE = this.config.policies.tosTemplateDE;
    this.termsEN = this.config.policies.tosTemplateEN;
  }

}
