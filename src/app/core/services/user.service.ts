import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AppConstants } from '../constants/common.constants';
import {environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private API_ENDPOINT = AppConstants.API_URL
  private API_ENDPOINT_USER = AppConstants.API_URL_USER
  private API_ENDPOINT_ROLE = AppConstants.API_URL_ROLE
  private API_ENDPOINT_ROLE_USERS = AppConstants.API_URL_ROLE_USERS
  private API_ENDPOINT_GROUP = AppConstants.API_URL_GROUP
  private API_ENDPOINT_GROUP_DELETE = AppConstants.API_URL_GROUP_DELETE
  constructor(
    private objHttpClient: HttpClient
  ) { }

  /**
   * @description : Get list of data from user table based on consitions specified in params
   * @param objParams : params for listing user on condition
   * @returns objResponse : response from hexabase user API
   */
  public listAllUsers(objParams: any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_USER}items/search`, objParams)
  }

   /**
   * @description : Get list of managers from hexabase based on conditions specified in params
   * @param objParams : params for listing managers on condition
   * @returns objResponse : response from hexabase user API
   */
  public listAllManagerRoles(): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT_ROLE_USERS}MANAGER`)
  }

     /**
   * @description : Get list of general users from hexabase based on conditions specified in params
   * @param objParams : params for listing general users on condition
   * @returns objResponse : response from hexabase user API
   */
  public listAllUserRoles(): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT_ROLE_USERS}USER`)
  }

     /**
   * @description : Get list of admin users from hexabase based on conditions specified in params
   * @param objParams : params for listing admins on condition
   * @returns objResponse : response from hexabase user API
   */
  public listAllAdminRoles(): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT_ROLE_USERS}ADMIN`)
  }

     /**
   * @description : Get list of users under specified group from hexabase based on conditions specified in params
   * @param objParams : params for listing all users under the specified group
   * @returns objResponse : response from hexabase user API
   */
  public listAllUsersByGroupId(groupId:any): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT_GROUP}${groupId}/users`)
  }

      /**
   * @description : Get list of all child groups under specified parent group from hexabase based on conditions specified in params
   * @param objParams : params for listing all groups under the specified group
   * @returns objResponse : response from hexabase user API
   */
  public listAllGroupsByGroupId(groupId:any): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT_GROUP}${groupId}`)
  }
  /* API's for user registration */

      /**
   * @description : Create a top group in hexabase
   * @returns objResponse : response from hexabase user API
   */

  public createParentGroup(body:any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT}workspaces/${environment.workspace_id}/groups`, body)
  }

     /**
   * @description : Create a child group under a paranet group in hexabase
   * @returns objResponse : response from hexabase user API
   */
  public createChildGroup(parentGroupId:any,body:any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_GROUP}${parentGroupId}`, body)
  }

     /**
   * @description : Get a child group id under a paranet group in hexabase
   * @returns objResponse : response from hexabase user API
   */
  public getChildGroupId(parentGroupId:any): Observable<any> {
    return this.objHttpClient.get(`${this.API_ENDPOINT_GROUP}${parentGroupId}`)
  }

    /**
   * @description : Add a new user in hexabase by providing userId,groupId and workspaceId
   * @returns objResponse : response from hexabase user API
   */
  public addUserToWorkspace(body:any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT}users`, body)
  }

     /**
   * @description : Assign role to newly created user by specifying roleId
   * @returns objResponse : response from hexabase user API
   */
  public addRoleToUser(body:any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_ROLE}`, body)
  }

    /**
   * @description : Delete the assigned role from a user by specifying roleId
   * @returns objResponse : response from hexabase user API
   */
    public removeRoleToUser(body:any): Observable<any> {
      return this.objHttpClient.delete(`${this.API_ENDPOINT_ROLE}`, {body})
    }

    /**
   * @description : Add newly created user details to HRMS user table.
   * @returns objResponse : response from hexabase user API
   */
  public addUserToDatabase(body:any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_USER}items/new`, body)
  }

    /**
   * @description : Delete a group in hexabase by specifying workspaceId and groupId
   * @returns objResponse : response from hexabase user API
   */
  public deleteGroup(body:any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_GROUP_DELETE}`,body)
  }

 /* API's for delete user */

  /**
   * @description : Delete a user from workspace by specifying userId,workspaceId and groupId
   * @returns objResponse : response from hexabase user API
   */
  public removeUserFromWorkspace(body:any): Observable<any> {
    return this.objHttpClient.delete(`${this.API_ENDPOINT}users`, {body})
  }

  /**
   * @description : Remove deleted user details from HRMS user table by specifying userId
   * @returns objResponse : response from hexabase user API
   */
  public removeUserFromDatabase(userId:any,body:any): Observable<any> {
    return this.objHttpClient.delete(`${this.API_ENDPOINT_USER}items/delete/${userId}`, {body})
  }

  /* API's for update profile details */

  /**
   * @description : update username in hexabase by logged user
   * @returns objResponse : response from hexabase user API
   */
  public updateProfile(body:any): Observable<any> {
    return this.objHttpClient.put(`${this.API_ENDPOINT}userinfo`, body)
  }

  /**
   * @description : update the new username in HRMS user table by specifying userId
   * @returns objResponse : response from hexabase user API
   */
  public updateUser(objParams: any, itemId: any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_USER}items/edit/${itemId}`, objParams)
  }
}
