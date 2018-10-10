import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';
import { NgModule } from '@angular/core';
import { NewsArticleComponent } from './news-article/news-article';
import { ExpandableComponent } from './expandable/expandable';
import { EventViewComponent } from './event-view/event-view';
import { ContentDrawerComponent } from './content-drawer/content-drawer';
import { TabBarComponent } from './tab-bar/tab-bar';

@NgModule({
	declarations: [
		NewsArticleComponent,
		ExpandableComponent,
		EventViewComponent,
    	ContentDrawerComponent,
    	TabBarComponent
	],
	imports: [
		IonicModule,
		TranslateModule
		],
	exports: [
		NewsArticleComponent,
		ExpandableComponent,
    	EventViewComponent,
    	ContentDrawerComponent,
    	TabBarComponent
	]
})
export class ComponentsModule {}
