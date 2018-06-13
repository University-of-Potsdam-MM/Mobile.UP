import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';
import { NgModule } from '@angular/core';
import { NewsArticleComponent } from './news-article/news-article';
@NgModule({
	declarations: [NewsArticleComponent],
	imports: [
		IonicModule,
		TranslateModule
		],
	exports: [NewsArticleComponent]
})
export class ComponentsModule {}
