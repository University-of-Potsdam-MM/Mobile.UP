import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LecturesPage } from './lectures.page';

const routes: Routes = [
  {
    path: '',
    component: LecturesPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LecturesPageRoutingModule {}
