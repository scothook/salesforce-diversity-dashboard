/**
 * @fileoverview LWC CSV Exporter. Given data table with headers and a title,
 * create a csv file. Data is from parent component.
 * @author Jessica Robertson
 */

import { LightningElement, api } from "lwc";
import { exportCSVFile } from "./utils";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class csvExporter extends LightningElement {
  @api mydata;
  @api title;
  @api columns;

  /**
   * @function downloadReportDetails
   * @summary once data and title is received then create a csv file.
   */
  downloadReportDetails() {
    if (this.columns && this.mydata && this.title) {
      exportCSVFile(this.columns, this.mydata, this.title);
    } else {
      // If button is clicked without there being data
      // then show error message
      this.showNotification();
    }
  }

  /**
   * @function showNotification
   * @summary Give user error that they can't download report.
   */
  showNotification() {
    const evt = new ShowToastEvent({
      title: "Error Downloading Report",
      message: "Data unavailable. Please enter your search parameters"
    });
    this.dispatchEvent(evt);
  }
}