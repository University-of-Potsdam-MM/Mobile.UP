import { Component, Input } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'news-article',
  templateUrl: 'news-article.html'
})
export class NewsArticleComponent {

  @Input() public article;

  constructor(private iap: InAppBrowser, private alertCtrl: AlertController, private translate: TranslateService) {
  }

  openWebsite(link) {

    let alert = this.alertCtrl.create({
      title: this.translate.instant("alert.title.website"),
      buttons: [
        {
          text: this.translate.instant("button.no"),
          role: 'disagree',
          handler: () => {
            console.log("Dialog dismissed");
          }
        },
        {
          text: this.translate.instant("button.yes"),
          role: 'agree',
          handler: () => {
            this.iap.create(link);
          }
        }
      ],
      enableBackdropDismiss: false,
    });
    alert.present();


  }

}
