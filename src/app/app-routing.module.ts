import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppConstants } from './core/constants/common.constants';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

const routes: Routes = [
  { path : '', redirectTo : 'hrms', pathMatch : 'full'},
  { path : 'hrms', loadChildren: ()=> import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard], title : `${AppConstants.APP_TITLE_COMMON}Dashboard`},
  { path : 'cadmin_hrms', loadChildren: ()=> import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard], title : `${AppConstants.APP_TITLE_COMMON}Dashboard`},
  { path : 'hrms/login', loadChildren: ()=> import('./modules/login/login.module').then(m => m.LoginModule), canActivate: [NoAuthGuard], title : `${AppConstants.APP_TITLE_COMMON}Login`},
  { path : 'cadmin_hrms/login', loadChildren: ()=> import('./modules/login/login.module').then(m => m.LoginModule), canActivate: [NoAuthGuard], title : `${AppConstants.APP_TITLE_COMMON}Login`},
  { path : '**', component : NotFoundComponent, title : "404"}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
