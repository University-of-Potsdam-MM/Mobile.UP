import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { WebIntentProvider } from '../../providers/web-intent/web-intent';
import { Storage } from '@ionic/storage';
import { IConfig } from '../../library/interfaces';

@IonicPage()
@Component({
  selector: 'page-detailed-practice',
  templateUrl: 'detailed-practice.html',
})
export class DetailedPracticePage {

  ADS;
  URLEndpoint;

  constructor(public navCtrl: NavController, public navParams: NavParams, private webIntent: WebIntentProvider, private storage: Storage) {
    this.ADS = this.navParams.data.ADS;
  }

  async ionViewDidLoad() {
    let config:IConfig = await this.storage.get("config");
    this.URLEndpoint = config.webservices.endpoint.practiceJobPostings;
  }

  openPdfLink(fileLink: string) {
    this.webIntent.permissionPromptWebsite(this.URLEndpoint + fileLink);
  }

}
