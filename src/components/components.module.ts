import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';
import { NgModule } from '@angular/core';
import { NewsArticleComponent } from './news-article/news-article';
import { ExpandableComponent } from './expandable/expandable';
import { EventViewComponent } from './event-view/event-view';
import { ContentDrawerComponent } from './content-drawer/content-drawer';
import { TabBarComponent } from './tab-bar/tab-bar';
import { CampusTabComponent } from './campus-tab/campus-tab';
import { GradesTableComponent } from './grades-table/grades-table';

@NgModule({
	declarations: [
		NewsArticleComponent,
		ExpandableComponent,
		EventViewComponent,
    	ContentDrawerComponent,
    	TabBarComponent,
    	CampusTabComponent,
    	GradesTableComponent
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
    	TabBarComponent,
    	CampusTabComponent,
    	GradesTableComponent
	]
})
export class ComponentsModule {}
