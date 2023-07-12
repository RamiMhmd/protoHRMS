import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonService } from 'src/app/core/services/common.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnDestroy, OnInit {

  private objDestroyed$ = new Subject();
  blnShowSpinner: boolean = false;
  intRouteType !: number;

  objLoginForm = this.objFormBuilder.group({
    email     : ['', [Validators.required]],
    password  : ['', [Validators.required]]
  });

  constructor(
    private objFormBuilder: FormBuilder,
    private objAuthService: AuthService,
    private objRouter: Router,
    private objCommonService: CommonService,
  ) { }

  ngOnDestroy() {
    this.objDestroyed$.next(void 0);
    this.objDestroyed$.complete();
  }

  ngOnInit(): void {
    this.intRouteType = window.location.pathname.includes('cadmin_hrms') ? 1 : 2;
  }

  /**
   * @description : handles the login functionality. Calls the login api service if the form is valid
   */
  loginUser() {
    if (this.objLoginForm.valid) {
      this.blnShowSpinner = true;
      this.objAuthService.loginUser(this.objLoginForm.value).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: () => {
          this.getApplicationDetails();
        },
        error: () => {
          this.blnShowSpinner = false;
          this.objCommonService.showError('Invalid Credentials')
        }
      });
    }
  }

  /**
   * @description : fetch applicationas and workspace details by calling corresponding hexabase APIS. Called to avoid errors occured while switching workspaces in Hexabase dashboard.
   */
  getApplicationDetails(){
    forkJoin([this.objAuthService.getCurrentUserInfo(false), this.objAuthService.getApplications()]).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse) => {
        this.blnShowSpinner = false;
        if (objResponse[0]?.user_roles[0]?.role_id === "ADMIN" && window.location.pathname == "/cadmin_hrms/login")
          this.objRouter.navigate(['cadmin_hrms/attendance']);
        else if ((objResponse[0]?.user_roles[0]?.role_id === "USER" || objResponse[0]?.user_roles[0]?.role_id === "MANAGER") && window.location.pathname == "/hrms/login")
          this.objRouter.navigate(['hrms/attendance']);
        else {
          this.objCommonService.showError('Invalid Credentials')
          this.logOutUser()
        }
      },
      error: () => {
        this.logOutUser()
        this.blnShowSpinner = false;
        this.objCommonService.showError('Invalid Credentials')
      }
    });
  }

  /**
   * @description : Perform logout functionalities
   */
  logOutUser(){
    this.objAuthService.logoutUser(false).pipe(takeUntil(this.objDestroyed$)).subscribe()
  }

}
