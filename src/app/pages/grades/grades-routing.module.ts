import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GradesPage } from './grades.page';

const routes: Routes = [
  {
    path: '',
    component: GradesPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GradesPageRoutingModule {}
