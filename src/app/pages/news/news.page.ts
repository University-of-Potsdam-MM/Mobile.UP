import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSlides } from '@ionic/angular';
import { INewsApiResponse } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage extends AbstractPage implements OnInit {
  @ViewChild(IonSlides) slides: IonSlides;

  public newsSource = 0;
  public newsList;
  public sourcesList = [];
  public isLoaded = false;
  public showLeftButton = false;
  public showRightButton = true;
  public selectedCategory = 0;
  public categories = [];
  networkError;

  slideOptions = {
    slidesPerView: 'auto'
  };

  constructor(
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.loadNews();
  }

  loadNews(refresher?) {
    if (!refresher) { this.isLoaded = false; }
    this.networkError = false;

    this.ws.call(
      'news',
      {},
      { forceRefresh: refresher !== undefined }
    ).subscribe((response: INewsApiResponse) => {

      if (refresher) { refresher.target.complete(); }

      if (response.errors.exist === false) {
        this.newsList = response.vars.news;
        const tmpArray = [];
        for (const source in response.vars.newsSources) {
          if (response.vars.newsSources.hasOwnProperty(source)) {
            tmpArray.push(response.vars.newsSources[source]);
          }
        }
        let i, j;
        this.sourcesList = [];
        for (i = 0; i < tmpArray.length; i++) {
          for (j = 0; j < this.newsList.length; j++) {
            if (this.newsList[j].NewsSource.name === tmpArray[i]) {
              this.sourcesList.push(tmpArray[i]);
              break;
            }
          }
        }
        this.categories = this.sourcesList;
        this.isLoaded = true;

        this.slides.update();
        if (this.selectedCategory === 0) {
          this.showLeftButton = false;
        }
      }
    }, error => {
      console.log(error);
      this.isLoaded = true;
      if (refresher) { refresher.target.complete(); }
      this.networkError = true;
    });
  }


  // Method executed when the slides are changed
  public async slideChanged() {
    this.showLeftButton = !await this.slides.isBeginning();
    this.showRightButton = !await this.slides.isEnd();
  }


  // Method that shows the next slide
  public slideNext(): void {
    this.slides.slideNext();
    this.slideChanged();
  }


  // Method that shows the previous slide
  public slidePrev(): void {
    this.slides.slidePrev();
    this.slideChanged();
  }


  public setNewsSource(i: number): void {
    this.newsSource = i;
    this.selectedCategory = i;
  }

  swipeNewsSource(event) {
    if (Math.abs(event.deltaY) < 50) {
      const maxIndex = this.sourcesList.length - 1;
      const currentIndex = this.newsSource;
      let newIndex;
      console.log(event);
      if (event.deltaX > 0) {
        // user swiped from left to right
        if (currentIndex > 0) {
          newIndex = currentIndex - 1;
          this.setNewsSource(newIndex);
          this.slides.slidePrev();
          this.slideChanged();
        }
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        if (currentIndex < maxIndex) {
          newIndex = currentIndex + 1;
          this.setNewsSource(newIndex);
          this.slides.slideNext();
          this.slideChanged();
        }
      }
    }
  }

}
