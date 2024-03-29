import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LibrarySearchPage } from './library-search.page';

const routes: Routes = [
  {
    path: '',
    component: LibrarySearchPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LibrarySearchPageRoutingModule {}
