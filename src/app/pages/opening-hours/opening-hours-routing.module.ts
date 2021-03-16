import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OpeningHoursPage } from './opening-hours.page';

const routes: Routes = [
  {
    path: '',
    component: OpeningHoursPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpeningHoursPageRoutingModule {}
