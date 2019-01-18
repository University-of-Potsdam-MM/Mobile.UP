import { INewsApiResponse, IConfig } from './../../library/interfaces';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Segment } from 'ionic-angular';
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
  @ViewChild(Segment) segment: Segment;

  newsSource:number;
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
        this.setNewsSource(0);
        this.isLoaded = true;
      }
    });
  }

  setNewsSource(i) {
    this.newsSource = i;
  }

  scrollSegmentBar(direction) {
    var selectedValue = this.segment.value;

    // I don't like working with underscore objects,
    // but this seems *slightly* nicer than working with native elements at this point, 
    // and it seems to be the easiest way to find the selected index
    var selectedIndex = this.segment._buttons.toArray().findIndex(function(button) { 
      return button.value === selectedValue; 
    });

    let maxIndex = this.sourcesList.length - 1;
    if (direction == "left") {
      if (selectedIndex > 1) {
        selectedIndex = selectedIndex - 2;
      }
    } else {
      if (selectedIndex < maxIndex-1) {
        selectedIndex = selectedIndex + 2;
      }
    }
            
    // Of course, now I need to work with the native element...
    var nativeSegment = <Element>this.segment.getNativeElement();
    
    // I pass in false to keep my page from scrolling vertically. YMMV
    nativeSegment.children[selectedIndex].scrollIntoView(false);
  }

  isActive(i) {
    if (this.newsSource == i) {
      return "primary"
    } else {
      return "secondary"
    }
  }

  swipeNewsSource(event) {
    if (Math.abs(event.deltaY) < 50) {
      let maxIndex = this.sourcesList.length - 1;
      let currentIndex = this.newsSource;
      var newIndex;
      if (event.deltaX > 0) {
        // user swiped from left to right
        if (currentIndex > 0) {
          newIndex = currentIndex-1;
          this.setNewsSource(newIndex);
          this.scrollSegmentBar("left");
        }
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        if (currentIndex < maxIndex) {
          newIndex = currentIndex+1;
          this.setNewsSource(newIndex);
          this.scrollSegmentBar("right");
        }
      }
    }
  }



}