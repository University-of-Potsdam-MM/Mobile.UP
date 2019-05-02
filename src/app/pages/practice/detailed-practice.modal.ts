import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';
import { IConfig } from 'src/app/lib/interfaces';
import { ConfigService } from 'src/app/services/config/config.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from 'src/app/services/alert/alert.service';

@Component({
  selector: 'detailed-practice-modal-page',
  templateUrl: './detailed-practice.modal.html',
})
export class DetailedPracticeModalPage implements OnInit {

  @Input() ADS;
  @Input() isFavorite;
  URLEndpoint;

  constructor(
      private modalCtrl: ModalController,
      private webIntent: WebIntentService,
      private translate: TranslateService,
      private alert: AlertService
    ) {
  }

  ngOnInit() {
    const config: IConfig = ConfigService.config;
    this.URLEndpoint = config.webservices.endpoint.practiceJobPostings.url;
  }

  closeModal() {
    this.modalCtrl.dismiss({
      'isFavoriteNew': this.isFavorite
    });
  }

  openPdfLink(fileLink: string) {
    this.webIntent.permissionPromptWebsite(this.URLEndpoint + fileLink);
  }

  favorite() {
    this.isFavorite = !this.isFavorite;

    if (!this.isFavorite) {
      this.alert.presentToast(this.translate.instant('hints.text.favRemoved'));
    } else {
      this.alert.presentToast(this.translate.instant('hints.text.favAdded'));
    }
  }

}
