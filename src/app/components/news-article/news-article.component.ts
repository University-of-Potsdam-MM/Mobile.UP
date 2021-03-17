import { Component, Input } from '@angular/core';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';

@Component({
  selector: 'app-news-article',
  templateUrl: './news-article.component.html',
  styleUrls: ['./news-article.component.scss'],
})
export class NewsArticleComponent {
  @Input() public article;

  constructor(public webIntent: WebIntentService) {
    // hides images that could not be loaded (404)
    // maybe show an replacement image in the future?
    const list = document.getElementsByTagName('img');

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < list.length; i++) {
      list[i].onerror = function () {
        this.style.display = 'none';
      };
    }
  }
}
