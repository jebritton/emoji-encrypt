import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConverterComponent } from './converter/converter.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: ConverterComponent },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
