import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';
import { IConfig } from 'src/app/lib/interfaces';
import { ConfigService } from 'src/app/services/config/config.service';
import { TranslateService } from '@ngx-translate/core';

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
      private toastCtrl: ToastController
    ) {
  }

  ngOnInit() {
    const config: IConfig = ConfigService.config;
    this.URLEndpoint = config.webservices.endpoint.practiceJobPostings;
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
      this.presentToast(this.translate.instant('hints.text.favRemoved'));
    } else {
      this.presentToast(this.translate.instant('hints.text.favAdded'));
    }
  }

  /**
   * @name presentToast
   * @param message
   */
  async presentToast(message) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'top',
      cssClass: 'toastPosition'
    });
    toast.present();
  }

}
