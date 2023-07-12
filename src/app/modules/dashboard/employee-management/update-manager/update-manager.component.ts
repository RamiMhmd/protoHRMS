import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AppConstants } from 'src/app/core/constants/common.constants';
import { environment } from 'src/environments/environment';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-update-manager',
  templateUrl: './update-manager.component.html',
  styleUrls: ['./update-manager.component.css']
})
export class UpdateManagerComponent {

  private objDestroyed$ = new Subject();
  private workspace_id = environment.workspace_id;
  public getScreenWidth: any;
  public getScreenHeight: any;
  aryManagerList: any = [];
  aryUserList: any = [];
  intPageNumber: number = 1;
  initPageSize: number = 0;
  intCurrentParentGroupId !: number;
  intNewParentGroupId !: number;
  intCurrentChildGroupId !: number;
  intNewChildGroupId !: number;
  intManagerId !: number;
  intSelectedUserItemId: any;
  strSelectedUserEmail : any;
  blnShowSpinner: boolean = false;
  blnShowSpinner2: boolean = false;
  browser: string ="Chrome";
  objEmployeeForm: FormGroup = this.objFormBuilder.group({
    currentManagerId: this.objFormBuilder.control('0', [Validators.required]),
    newManagerId: this.objFormBuilder.control('0', [Validators.required]),
    selectedEmployee: this.objFormBuilder.control('', [Validators.required]),
  });

  constructor(
    private objFormBuilder: FormBuilder,
    public objActiveModal: NgbActiveModal,
    private objUserService: UserService,
    private objCommonService: CommonService,
    private deviceService: DeviceDetectorService
  ) { }
  ngOnInit(): void {
    this.getManagerRoleUsers();
  }
    /**
   * @description : To close or dismiss the add employee modal
   * @returns null
   */
    openCloseModal(intStatus: any) {
      if (intStatus === 1) {
        this.objActiveModal.close(1)
      }
      else
        this.objActiveModal.dismiss()
    }
   /**
   * @description : To get the list of employees with 'Manager' role
   * @returns null
   */
    getManagerRoleUsers() {
      this.objUserService.listAllManagerRoles().pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: (objResponse: any) => {
          this.aryManagerList = objResponse.role_users;
        },
        error: () => {
          this.objCommonService.showError('Error.Please try after some times')
        }
      })
    }

    /**
   * @description : To get the Group details of the selected manager
   * @param event: the change event of 'Manager' dropdown
   * @param managerType: To know whether the called function from current or new manager dropdown
   * @returns null
   */
  getManagerDetails(event: any,managerType:any) {
    if(managerType === 1){
      this.blnShowSpinner2 =  true;
    }
    if(this.objEmployeeForm.controls['currentManagerId'].value != '0' && this.objEmployeeForm.controls['newManagerId'].value != '0'){
      if((this.objEmployeeForm.controls['currentManagerId'].value === this.objEmployeeForm.controls['newManagerId'].value) && managerType === 1 ){
        this.objEmployeeForm.controls['newManagerId'].setValue('0');
      }else if ((this.objEmployeeForm.controls['currentManagerId'].value === this.objEmployeeForm.controls['newManagerId'].value) && managerType === 2 ){
        this.objEmployeeForm.controls['currentManagerId'].setValue('0');
      }
    }
    const params = {
      "conditions": [{ "id": "User_id", "search_value": [event.target.value], "exact_match": true }],
      "page": this.intPageNumber,
      "per_page": 0,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if(managerType == 1){
          this.intCurrentParentGroupId = objResponse.items[0].Group_id;
        }else if(managerType == 2){
          this.intNewParentGroupId = objResponse.items[0].Group_id;
        }
        this.getChildGroupId(objResponse.items[0].Group_id,managerType);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
    /**
   * @description : To get the childGroup_id of the selected manager
   * @param parentGroupId: the Group_id of the manager from 'Manager' dropdown
   * @param managerType: To know whether the called function from current or new manager dropdown
   * @returns null
   */
    getChildGroupId(parentGroupId: any,managerType:any) {
      this.objUserService.getChildGroupId(parentGroupId).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: (objResponse: any) => {
          if(managerType == 1){
            this.getChildGroupUsers(objResponse.children[0].g_id);
            this.intCurrentChildGroupId = objResponse.children[0].g_id;
          }else if(managerType == 2){
            this.intNewChildGroupId = objResponse.children[0].g_id;
          }
        },
        error: () => {
          this.objCommonService.showError('Error.Please try after some times')
        }
      })
    }

    getChildGroupUsers(childGroupId: any) {
      this.blnShowSpinner2 = true;
      this.aryUserList = [];
      this.objUserService.listAllUsersByGroupId(childGroupId).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: (objResponse: any) => {
          this.aryUserList = this.aryUserList.concat(objResponse.members);
          this.blnShowSpinner2 =  false;
          this.blnShowSpinner = false;
        },
        error: () => {
          this.blnShowSpinner2 =  false;
          this.objCommonService.showError('Error.Please try after some times')
        }
      })
    }

    selectedUserDetails(i:any){
    this.strSelectedUserEmail = i.email;
    const params = {
      "conditions": [{ "id": "User_id", "search_value": [i.u_id], "exact_match": true }],
      "page": this.intPageNumber,
      "per_page": 0,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
          this.intSelectedUserItemId = objResponse.items[0].i_id;
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
    }

    changeManager(){
      this.blnShowSpinner = true;
      this.addUserUnderNewManager();
    }

    addUserUnderNewManager(){
      const body = {
        "email": this.strSelectedUserEmail,
        "g_id": this.intNewChildGroupId,
        "w_id": this.workspace_id
      }
      this.objUserService.addUserToWorkspace(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: (objResponse: any) => {
          if (objResponse.user_profile.confirmed === false) {
            this.objCommonService.showError('Email id not found');
            this.blnShowSpinner = false;
          } else {
            this.addRoleToUser(this.objEmployeeForm.controls['selectedEmployee'].value, "USER")
          }
        },
        error: () => {
          this.objCommonService.showError('Error.Please try after some times');
          this.blnShowSpinner = false;
        }
      })
    }

    addRoleToUser(userId: any, role: any) {
      const body = {
        "user_id": userId,
        "role_id": role
      }
      this.objUserService.addRoleToUser(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: () => {
          this.updateUserTableWithNewManager()
        },
        error: () => {
          this.deleteUserFromCurrentManager(this.intNewChildGroupId);
          this.objCommonService.showError('Error.Please try after some times');
          this.blnShowSpinner = false;
        }
      })
    }

    updateUserTableWithNewManager(){
      const paramsUser = {
        "item": {
          "Manager_Id": this.objEmployeeForm.controls['newManagerId'].value,
          "Group_id": this.intNewChildGroupId
        },
        "use_display_id": true,
        "is_force_update": true
      }
      this.objUserService.updateUser(paramsUser, this.intSelectedUserItemId).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: (objResponse1: any) => {
          this.deleteUserFromCurrentManager(this.intCurrentChildGroupId);
        }, error: () => {
          this.deleteUserFromCurrentManager(this.intNewChildGroupId);
          this.blnShowSpinner = false;
          this.objCommonService.showError('Error.Please try after some times')
        }
      })
    }

    deleteUserFromCurrentManager(group_id:any){
      const body = {
        "g_id": group_id,
        "u_id": this.objEmployeeForm.controls['selectedEmployee'].value,
        "w_id": this.workspace_id
      }
      this.objUserService.removeUserFromWorkspace(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: () => {
          this.objCommonService.showSuccess('User moved successfully.');
          this.objEmployeeForm.controls['selectedEmployee'].setValue('');
          this.getChildGroupUsers(this.intCurrentChildGroupId);
        },
        error: () => {
          this.objCommonService.showError('Error.Please try after some times');
          this.blnShowSpinner = false;
        }
      })
    }
}
