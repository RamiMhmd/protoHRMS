import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  bsUserDetails$ = new BehaviorSubject<any>(null);

  constructor(private objToastr: ToastrService) { }

  /**
   * @description : Show a success toast with the given message using ngx toaster service
   * @param strMessage : message which need to be shown in the toaster
   */
  showSuccess(strMessage: string) {
    this.objToastr.success(strMessage);
  }

  /**
   * @description : Show a error toast with the given message using ngx toaster service
   * @param strMessage : message which need to be shown in the toaster
   */
  showError(strMessage: string) {
    this.objToastr.error(strMessage);
  }

  /**
   * @description : Show a warning toast with the given message using ngx toaster service
   * @param strMessage : message which need to be shown in the toaster
   */
  showWarning(strMessage: string) {
    this.objToastr.warning(strMessage);
  }

  /**
   * @description : gets user details as observable 
   */
  get getUserDetais(){
    return this.bsUserDetails$.asObservable()
  }

  /**
   * @description : sets user details into observable
   * @param objUserDetails : New data of current logged in user
   */
  setUserDetails(objUserDetails : any){
    this.bsUserDetails$.next(objUserDetails);
  }

}
