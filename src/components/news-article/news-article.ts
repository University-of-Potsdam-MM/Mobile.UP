import { Component, Input } from '@angular/core';

@Component({
  selector: 'news-article',
  templateUrl: 'news-article.html'
})
export class NewsArticleComponent {

  @Input() public article;

  constructor() {
  }

}
