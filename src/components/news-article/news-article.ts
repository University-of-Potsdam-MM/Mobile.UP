import { Component, Input } from '@angular/core';
import { WebIntentProvider } from '../../providers/web-intent/web-intent';

@Component({
  selector: 'news-article',
  templateUrl: 'news-article.html'
})
export class NewsArticleComponent {

  @Input() public article;

  constructor(
    public webIntent: WebIntentProvider) {

    // hides images that could not be loaded (404)
    // maybe show an replacement image in the future?
    const list = document.getElementsByTagName("img");

    var i;
    for (i = 0; i < list.length; i++)
    list[i].onerror = function() {
      this.style.display = "none";
    };

  }
}