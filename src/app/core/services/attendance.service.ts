import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AppConstants } from '../constants/common.constants';
import {environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private API_ENDPOINT_ATTENDANCE = AppConstants.API_URL_ATTENDANCE

  constructor(
    private objHttpClient: HttpClient
  ) { }

  /**
   * @description : Get list of data from attendance table based on consitions specified in params
   * @param objParams : params for listing attendance on condition
   * @returns objResponse : response from hexabase attendance API
   */
  public listAttendance(objParams: any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_ATTENDANCE}items/search`, objParams)
  }

  /**
   * @description api to add attendance
   * @param objParams includes payload to add attendance
   * @returns response of add attendace api
   */
  public addAttendance(objParams: any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_ATTENDANCE}items/new`, objParams)
  }

  /**
   * @description api to update attendance details
   * @param objParams includes payload to update attendance
   * @param objItemId id of attendance which need to be updated
   * @returns response of update api
   */
  public editAttendance(objParams: any,objItemId:any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_ATTENDANCE}items/edit/${objItemId}`, objParams)
  }

  /**
   * @description api to delete attendance
   * @param objItemIdid of attendance which need to be deleted
   * @returns response of delete api
   */
  public deleteAttendance(objItemId:any): Observable<any> {
    return this.objHttpClient.delete(`${this.API_ENDPOINT_ATTENDANCE}items/delete/${objItemId}`, { body: {"delete_linked_items" : true }})
  }

   /**
   * @description api to update more than one attendance data
   * @param objParams of attendance which need to be updated
   * @returns response of bulk update api
   */
  public bulkUpdateAttendance(objParams: any): Observable<any> {
    return this.objHttpClient.post(`${this.API_ENDPOINT_ATTENDANCE}items/bulkaction/${environment.attendance_update_action_id}`, objParams)
  }

  /**
   * @description api to delete more than one attendance data
   * @param objParams of attendance which need to be deleted
   * @returns response of bulk delete api
   */
  public bulkDeleteAttendance(objParams: any): Observable<any> {
    return this.objHttpClient.delete(`${this.API_ENDPOINT_ATTENDANCE}items/delete`, { body: objParams})
  }
}
