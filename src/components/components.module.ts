import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';
import { NgModule } from '@angular/core';
import { NewsArticleComponent } from './news-article/news-article';
import { ExpandableComponent } from './expandable/expandable';

@NgModule({
	declarations: [
		NewsArticleComponent,
		ExpandableComponent],
	imports: [
		IonicModule,
		TranslateModule
		],
	exports: [
		NewsArticleComponent,
		ExpandableComponent
	]
})
export class ComponentsModule {}
