import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Mensa2Page } from './mensa2.page';

const routes: Routes = [
  {
    path: '',
    component: Mensa2Page,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Mensa2PageRoutingModule {}
