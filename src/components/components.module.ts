import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';
import { NgModule } from '@angular/core';
import { NewsArticleComponent } from './news-article/news-article';
import { ExpandableComponent } from './expandable/expandable';
import { EventViewComponent } from './event-view/event-view';

@NgModule({
	declarations: [
		NewsArticleComponent,
		ExpandableComponent,
		EventViewComponent
	],
	imports: [
		IonicModule,
		TranslateModule
		],
	exports: [
		NewsArticleComponent,
		ExpandableComponent,
    	EventViewComponent
	]
})
export class ComponentsModule {}
