import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { IConfig } from '../../library/interfaces';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-legal-notice',
  templateUrl: 'legal-notice.html',
})
export class LegalNoticePage {

  config:IConfig;
  impressumDE;
  impressumEN;
  lang;

  constructor(public navCtrl: NavController, public navParams: NavParams, private translate: TranslateService) {
  }

  ngOnInit() {
    this.config = this.navParams.data.config;
    this.lang = this.translate.currentLang;
    this.impressumDE = this.config.policies.impressumTemplateDE;
    this.impressumEN = this.config.policies.impressumTemplateEN;
  }

}
