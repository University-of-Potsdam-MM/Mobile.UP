import { NgModule } from '@angular/core';
import { MomentPipe } from './moment/moment';
@NgModule({
	declarations: [MomentPipe],
	imports: [],
	exports: [MomentPipe]
})
export class PipesModule {}
