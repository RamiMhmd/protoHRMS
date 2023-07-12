import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { setTheme } from 'ngx-bootstrap/utils';
setTheme('bs4')
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotFoundComponent } from './not-found/not-found.component';



@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    NotFoundComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    BsDatepickerModule.forRoot(),
    FormsModule
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    BsDatepickerModule,
    FormsModule,
    SidebarComponent
  ]
})
export class ComponentsModule { }
