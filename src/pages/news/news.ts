import { NewsProvider } from './../../providers/news/news';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
})
export class NewsPage {

  newsSource = "0";
  newsList;
  sourcesList = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, public newsProv: NewsProvider) {
  }

  ngOnInit() {

    this.newsProv.getNews().subscribe(response => {
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
