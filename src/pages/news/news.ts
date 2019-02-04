import { INewsApiResponse, IConfig } from './../../library/interfaces';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Injector, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Slides } from 'ionic-angular';
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
  @ViewChild(Slides) slides: Slides;


  public newsSource:number = 0;
  public newsList;
  public sourcesList = [];
  public isLoaded = false;
  public showLeftButton: boolean;
  public showRightButton: boolean;
  public selectedCategory = 0;
  public categories = [];

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private http: HttpClient,
              public injector: Injector,
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
        this.categories = this.sourcesList;
        this.isLoaded = true;

        this.slides.update();
        this.slideChanged();
        if (this.selectedCategory == 0) {
          this.showLeftButton = false;
        }
      }
    });
  }


  // Method executed when the slides are changed
  public slideChanged(): void {
    this.showLeftButton = !this.slides.isBeginning();
    this.showRightButton = !this.slides.isEnd();
  }


  // Method that shows the next slide
  public slideNext(): void {
    this.slides.slideNext();
  }


  // Method that shows the previous slide
  public slidePrev(): void {
    this.slides.slidePrev();
  }


  public setNewsSource(i: number): void {
    this.newsSource = i;
    this.selectedCategory = i;
  }


  swipeNewsSource(event) {
    if (Math.abs(event.deltaY) < 50) {
      let maxIndex = this.sourcesList.length - 1;
      let currentIndex = this.newsSource;
      var newIndex;
      console.log(event);
      if (event.deltaX > 0) {
        // user swiped from left to right
        if (currentIndex > 0) {
          newIndex = currentIndex-1;
          this.setNewsSource(newIndex);
          this.slides.slidePrev();
        }
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        if (currentIndex < maxIndex) {
          newIndex = currentIndex+1;
          this.setNewsSource(newIndex);
          this.slides.slideNext();
        }
      }
    }
  }
}