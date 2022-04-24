import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImpressumPage } from './impressum.page';

const routes: Routes = [
  {
    path: '',
    component: ImpressumPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImpressumPageRoutingModule {}
