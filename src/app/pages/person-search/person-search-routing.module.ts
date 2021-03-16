import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PersonSearchPage } from './person-search.page';

const routes: Routes = [
  {
    path: '',
    component: PersonSearchPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonSearchPageRoutingModule {}
