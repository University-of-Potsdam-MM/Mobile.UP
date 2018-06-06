import { NewsProvider } from './../../providers/news/news';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-news',
  templateUrl: 'news.html',
})
export class NewsPage {

  newsSource = "1";
  newsList;

  constructor(public navCtrl: NavController, public navParams: NavParams, public newsProv: NewsProvider) {
  }

  ngOnInit() {

    this.newsProv.getNews().subscribe(response => {
      if (response.errors.exist == false) {
        this.newsList = response.vars.news;
      }
    });

  }

}
