import { INewsApiResponse, IConfig } from './../../library/interfaces';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';

@IonicPage()
@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
})
export class NewsPage {

  newsSource = "0";
  newsList;
  sourcesList = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private http: HttpClient, private storage: Storage) {
  }

  async ngOnInit() {

    let config: IConfig = await this.storage.get("config");

    var url = config.webservices.endpoint.news;
    this.http.get(url).subscribe((response:INewsApiResponse) => {
      if (response.errors.exist == false) {
        this.newsList = response.vars.news;
        for (var source in response.vars.newsSources) {
          this.sourcesList.push(response.vars.newsSources[source])
        }
      }
    });


  }

  setNewsSource(i) {
    this.newsSource = i;
  }

  isActive(i) {
    if (this.newsSource == i) {
      return "primary"
    } else {
      return "secondary"
    }
  }

}
