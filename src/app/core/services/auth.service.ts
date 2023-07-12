import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AppConstants } from '../constants/common.constants';
import { CommonService } from './common.service';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API_ENDPOINT = AppConstants.API_URL;
  private API_ENDPOINT_APP = AppConstants.API_URL_APPLICATIONS;
  private JWT_TOKEN = 'JWT_TOKEN';
  private intUserRole : any;

  constructor(
    private objHttpClient: HttpClient,
    private objRouter: Router,
    private objCommonService: CommonService,
    private objActivatedRoute: ActivatedRoute,
    public objActiveModal: NgbModal,
  ) { }

  /**
   * @description : handles the login request from the login comoonent, Calls the hexabase api,
   * @param objParams : params got form login cmponent
   * @returns objResponse : response from hexabase login API
   */
  public loginUser(objParams: any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT}login`, objParams).pipe(
      map((objResponse: any) => {
        const accessToken = objResponse["token"];
        if (accessToken) {
          localStorage.setItem(this.JWT_TOKEN, accessToken);
        }
        return objResponse;
      })
    );
  }

  /**
   * @description : Logout user from the system
   * @param blnRoute : tre will be passed if routing to logot is needed
   * @returns objResponse : response from hexabase logout API
   */
  public logoutUser(blnRoute: boolean): Observable<any> {
    let strUserType = this.objActivatedRoute.snapshot?.firstChild?.url[0].path
    return this.objHttpClient.post(`${this.API_ENDPOINT}users/logout`, {}).pipe(
      map(() => {
        this.handleUILogout(blnRoute, strUserType);
      }),
      catchError(error => {
        this.handleUILogout(blnRoute, strUserType);
        return of(error)
      })
    );
  }

  /**
   * Calls the hexabase api to fetch the currently logged in user and
   * @returns response of userInfo API
   */
  public getCurrentUserInfo(blnRoute : boolean): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT}userinfo`, {}).pipe(
      map((objResponse : any) => {
        if(objResponse?.user_roles[0]?.role_id === "USER"){
         this.intUserRole = 3;
        } else  if(objResponse?.user_roles[0]?.role_id === "MANAGER"){
          this.intUserRole = 2;
        } else  if(objResponse?.user_roles[0]?.role_id === "ADMIN"){
          this.intUserRole = 1;
        } 
        this.objCommonService.setUserDetails({
          userId    : objResponse?.u_id,
          userName  : objResponse?.username,
          role      : this.intUserRole,
          email     : objResponse?.email,
          groupId   : objResponse?.user_groups[0].g_id
        })
        if(blnRoute)
          this.checkUrlValidity(this.intUserRole)
        return objResponse;
      }),
      catchError(error => {
        return of(error)
      })
    );
  }

  /**
   * @description Handles clearing browser storage and routing to login page id necessary
   * @param blnRoute Confirm whether the routing to login page is required
   * @param strUserType To attach the user type in routing 
   */
  handleUILogout(blnRoute : any, strUserType :  any) {
    if (blnRoute) {
      this.objRouter.navigate([`${strUserType}/login`])
      this.objActiveModal.dismissAll();
    }
    localStorage.clear();
    setTimeout(() => { this.objCommonService.setUserDetails(null) }, 100);
  }

  /**
   * @description :  Checks whether the user is logged in or not based on presence of JWT Token in local storage
   * @returns : true/false based on the token existance
   */
  isLoggedIn(): boolean {
    return localStorage.getItem(this.JWT_TOKEN) != null;
  }

  /**
   * @description fetch the JWT Token stored in the local storage
   * @returns : token stored in the local storage
   */
  getAccessToken(){
    return localStorage.getItem(this.JWT_TOKEN)
  }

  /**
   * @description Check whether the loggedin user role and the route url matches
   */
  checkUrlValidity(intUserRole : number){
    if( this.objActivatedRoute.snapshot?.firstChild?.url[0].path == 'cadmin_hrms' && intUserRole !== 1){
      let newURL = this.objRouter.url.replace("cadmin_hrms", "hrms");
      this.objRouter.navigate([newURL])
    } else if( this.objActivatedRoute.snapshot?.firstChild?.url[0].path == 'hrms' && intUserRole === 1 ){
      let newURL = this.objRouter.url.replace("hrms", "cadmin_hrms");
      this.objRouter.navigate([newURL])
    }
  }

  /**
   * @description : Calls API to fetch workspace List
   */
  getWorkSpaces(): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT}workspaces`, {})
  }

  /**
  * @description : Calls API to fetch Application List
  */
  getApplications(): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT_APP}`, {})
  }
}