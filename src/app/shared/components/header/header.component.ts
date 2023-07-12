import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonService } from 'src/app/core/services/common.service';
import { UserService } from 'src/app/core/services/user.service'
import { EmployeeEditModalComponent } from 'src/app/modules/dashboard/employee-management/employee-edit-modal/employee-edit-modal.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnDestroy, OnInit {

  private objDestroyed$ = new Subject();

  strUserName !: string;
  userId !: any;
  userrole !: any

  constructor(
    private objAuthService : AuthService,
    private objCommonService : CommonService,
    private objModalService: NgbModal,
    private objUserService: UserService
  ) { }

  ngOnDestroy() {
    this.objDestroyed$.next(void 0);
    this.objDestroyed$.complete();
  }

  ngOnInit(): void {
    this.getUserDetails()
  }

  /**
    * @description : Logout user from the system
    */
  logout() {
    this.objAuthService.logoutUser(true).pipe(takeUntil(this.objDestroyed$)).subscribe()
  }

  /**
   * @description : Subscribe to logged in user details  obsersavable. If it is null fetch data from userInfo API
   */
  getUserDetails(){
    this.objCommonService.getUserDetais.pipe(takeUntil(this.objDestroyed$)).subscribe({
      next : (objResponse : any) => {
        if(objResponse){
          this.strUserName = objResponse.userName;
          this.userId = objResponse.userId;
          this.userrole = objResponse.role;
        } else {
          this.getCurrentUserInfo()
        }
      }
    })
  }

  /**
   * @description : fetch the details of currently loggedin user
   */
  getCurrentUserInfo() {
    this.objAuthService.getCurrentUserInfo(true).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse) => {
        if (objResponse.totalItems == 0) {
          this.logout()
        }
      },
      error: () => {
        this.logout()
      }
    });
  }

  openModal(strModalSize?: string) {
    const modalRef = this.objModalService.open(EmployeeEditModalComponent, { size: strModalSize || 'lg', centered: true });
    modalRef.componentInstance.selfUpdate = true;
    modalRef.componentInstance.userId = this.userId;
    modalRef.componentInstance.userrole = this.userrole;
    modalRef.result.then((result) => {
      console.log("ModalClosed",result )
      if(result === 3){
        this.objCommonService.showSuccess('Profile updated successfully');
       this.getCurrentUserInfo()
      }
     
    }, (reason) => { });
  }
}
