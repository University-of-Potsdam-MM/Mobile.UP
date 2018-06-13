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

    // hides images that could not be loaded (404)
    // maybe show an replacement image in the future?
    const list = document.getElementsByTagName("img");

    var i;
    for (i = 0; i < list.length; i++)
    list[i].onerror = function() {
      this.style.display = "none";
    };

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
