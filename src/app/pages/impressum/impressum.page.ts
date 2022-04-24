import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { ConfigService } from 'src/app/services/config/config.service';
import { ImpressumModalPage } from './impressum.modal';

@Component({
  selector: 'app-impressum',
  templateUrl: './impressum.page.html',
  styleUrls: ['./impressum.page.scss'],
})
export class ImpressumPage extends AbstractPage {
  constructor(
    private translate: TranslateService,
    private modalCtrl: ModalController
  ) {
    super();
  }

  async openSection(pageHeader: string) {
    let pageText;
    switch (pageHeader) {
      case 'page.termsOfUse.title': {
        if (this.translate.currentLang === 'de') {
          pageText = ConfigService.config.policies.tosTemplateDE;
        } else {
          pageText = ConfigService.config.policies.tosTemplateEN;
        }
        break;
      }
      case 'page.legalNotice.title': {
        if (this.translate.currentLang === 'de') {
          pageText = ConfigService.config.policies.impressumTemplateDE;
        } else {
          pageText = ConfigService.config.policies.impressumTemplateEN;
        }
        break;
      }
      case 'page.privacyPolicy.title': {
        if (this.translate.currentLang === 'de') {
          pageText = ConfigService.config.policies.privacyTemplateDE;
        } else {
          pageText = ConfigService.config.policies.privacyTemplateEN;
        }
        break;
      }
    }

    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: ImpressumModalPage,
      componentProps: {
        header: this.translate.instant(pageHeader),
        text: pageText,
      },
    });
    modal.present();
    await modal.onDidDismiss();
  }
}
