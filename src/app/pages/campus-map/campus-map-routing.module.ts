import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CampusMapPage } from './campus-map.page';

const routes: Routes = [
  {
    path: '',
    component: CampusMapPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampusMapPageRoutingModule {}
