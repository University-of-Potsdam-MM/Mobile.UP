import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ImpressumModalPage } from './impressum.modal';
import { TranslateService } from '@ngx-translate/core';
import { IConfig } from 'src/app/lib/interfaces';
import { ConfigService } from 'src/app/services/config/config.service';
import { AbstractPage } from 'src/app/lib/abstract-page';

@Component({
  selector: 'app-impressum',
  templateUrl: './impressum.page.html',
  styleUrls: ['./impressum.page.scss'],
})
export class ImpressumPage extends AbstractPage implements OnInit {

  config: IConfig;
  modalOpen = false;

  constructor(
    private modalCtrl: ModalController,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.config = ConfigService.config;
  }

  async openPage(pageHeader: string) {
    let pageText;
    switch (pageHeader) {
      case 'page.termsOfUse.title': {
        if (this.translate.currentLang === 'de') {
          pageText = this.config.policies.tosTemplateDE;
        } else { pageText = this.config.policies.tosTemplateEN; }
        break;
      }
      case 'page.legalNotice.title': {
        if (this.translate.currentLang === 'de') {
          pageText = this.config.policies.impressumTemplateDE;
        } else { pageText = this.config.policies.impressumTemplateEN; }
        break;
      }
      case 'page.privacyPolicy.title': {
        if (this.translate.currentLang === 'de') {
          pageText = this.config.policies.privacyTemplateDE;
        } else { pageText = this.config.policies.privacyTemplateEN; }
        break;
      }
    }

    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: ImpressumModalPage,
      componentProps: { header: this.translate.instant(pageHeader), text: pageText }
    });
    modal.present();
    this.modalOpen = true;
    await modal.onDidDismiss();
    this.modalOpen = false;
  }

}
