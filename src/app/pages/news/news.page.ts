import { Component, OnInit } from '@angular/core';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { INewsApiResponse } from 'src/app/lib/interfaces';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage extends AbstractPage implements OnInit {
  public newsSource = 0;
  public newsList;
  public sourcesList = [];
  public isLoaded = false;
  public selectedCategory = 0;
  public categories = [];
  networkError;

  constructor(private ws: WebserviceWrapperService) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.loadNews();
  }

  loadNews(refresher?) {
    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    }
    this.networkError = false;

    this.ws
      .call('news', {}, { forceRefresh: refresher !== undefined })
      .subscribe(
        (response: INewsApiResponse) => {
          if (refresher && refresher.target) {
            refresher.target.complete();
          }

          if (
            response.errors === undefined ||
            response.errors.exist === false
          ) {
            this.newsList = response.vars.news.sort(function (a, b) {
              return Number(b.News.time) - Number(a.News.time);
            });
            const tmpArray = [];
            // eslint-disable-next-line guard-for-in
            for (const source in response.vars.newsSources) {
              tmpArray.push(response.vars.newsSources[source]);
            }
            let i;
            let j;
            this.sourcesList = [];
            for (i = 0; i < tmpArray.length; i++) {
              for (j = 0; j < this.newsList.length; j++) {
                if (this.newsList[j].NewsSource.name === tmpArray[i]) {
                  if (tmpArray[i] !== 'Zur Quelle') {
                    this.sourcesList.push(tmpArray[i]);
                  }
                  break;
                }
              }
            }
            this.categories = this.sourcesList;
            this.isLoaded = true;
          }
        },
        () => {
          this.isLoaded = true;
          if (refresher && refresher.target) {
            refresher.target.complete();
          }
          this.networkError = true;
        }
      );
  }

  public setNewsSource(i: number): void {
    this.newsSource = i;
    this.selectedCategory = i;
  }
}
