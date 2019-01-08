import { INewsApiResponse, IConfig } from './../../library/interfaces';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { CacheService } from 'ionic-cache';
import { ConnectionProvider } from "../../providers/connection/connection";


/**
 * @class NewsPage
 * @classdesc Class for a page that shows News entries
 */
@IonicPage()
@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
})
export class NewsPage {

  newsSource = "0";
  newsList;
  sourcesList = [];
  isLoaded = false;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private http: HttpClient,
              private storage: Storage,
              private cache: CacheService,
              private connection: ConnectionProvider) {
  }

  ngOnInit() {
    this.connection.checkOnline(true, true);
    this.loadNews();
  }

  async loadNews(refresher?) {
    let config: IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

    var url = config.webservices.endpoint.news;
    let request = this.http.get(url, {headers:headers});

    if (refresher) {
      this.cache.removeItem("newsResponse");
    } else {
      this.isLoaded = false;
    }

    this.cache.loadFromObservable("newsResponse", request).subscribe((response:INewsApiResponse) => {

      if (refresher) {
        refresher.complete();
      }

      if (response.errors.exist == false) {
        this.newsList = response.vars.news;
        var tmpArray = [];
        for (var source in response.vars.newsSources) {
          tmpArray.push(response.vars.newsSources[source]);
        }
        var i,j;
        this.sourcesList = [];
        for (i = 0; i < tmpArray.length; i++) {
          for (j = 0; j < this.newsList.length; j++) {
            if (this.newsList[j].NewsSource.name == tmpArray[i]) {
              this.sourcesList.push(tmpArray[i]);
              break;
            }
          }
        }
        this.isLoaded = true;
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