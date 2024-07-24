/**
 * @fileoverview LWC Datepicker. Allow user to pick a start and end date then
 * transmit those choices to the date selection channel. Ensure that both the start
 * and end date exist. End date must be after start date. Show a notification to the
 * user if the end date is before the start date.
 * @author Jessica Robertson
 */

/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, wire, api } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import DATE_SELECTION_CHANNEL from "@salesforce/messageChannel/DateSelection__c";

/*eslint no-unused-vars:off, consistent-return:off, */
export default class Datepicker extends LightningElement {
  startDate;
  endDate;
  showCal = false;

  get options() {
    return [
      { label: "Custom", value: "customRange" },
      { label: "Today", value: "today" },
      { label: "Last 30 Days", value: "last" },
      { label: "Last 90 Days", value: "lastThree" },
      { label: "Last 180 Days", value: "lastSix" },
      { label: "Last 365 Days", value: "lastTwelve" }
    ];
  }

  handleChange(event) {
    try {
      this.value = event.detail.value;

      let currentDate = new Date();
      if (this.value === "customRange") {
        this.showCal = true;
      } else {
        this.showCal = false;
        switch (true) {
          case this.value === "today":
            break;
          case this.value === "last":
            currentDate.setMonth(currentDate.getMonth() - 1);
            break;
          case this.value === "lastThree":
            currentDate.setMonth(currentDate.getMonth() - 3);
            break;
          case this.value === "lastSix":
            currentDate.setMonth(currentDate.getMonth() - 6);
            break;
          case this.value === "lastTwelve":
            currentDate.setFullYear(currentDate.getFullYear() - 1);
            break;
          default:
            break;
        }
        this.startDate = currentDate.toISOString().split("T")[0];
        let today = new Date();
        this.endDate = today.toISOString().split("T")[0];
        console.log(this.startDate);
        console.log(this.endDate);
        this.publishDateRange();
      }
    } catch (error) {
      console.log(error);
    }
  }

  @wire(MessageContext)
  context;

  /**
   * @function handleStartDateChange
   * @summary If user changes the start date,
   * change the published date.
   * @param {*} event
   */
  handleStartDateChange(event) {
    var chooseStart = event.target.value;
    this.startDate = chooseStart;
    this.publishDateRange();
  }

  /**
   * @function handleEndDateChange
   * @summary If user changes the end date,
   * change the published date.
   * @param {*} event
   */
  handleEndDateChange(event) {
    var chooseEnd = event.target.value;
    this.endDate = chooseEnd;
    this.publishDateRange();
  }

  /**
   * @function publishDateRange
   * @summary if user has chosen both a start and end date
   * then publish those dates to the date selection channel
   * can also be accessed through the events
   */
  @api publishDateRange() {
    let startVar = new Date(this.startDate);
    let endVar = new Date(this.endDate);

    // Make sure user has chosen both dates
    if (this.startDate && this.endDate) {
      // If the end date is the same as or before
      // the start date then show an error message
      if (endVar < startVar) {
        this.showNotification();
      } else {
        const payload = {
          startDate: this.startDate,
          endDate: this.endDate
        };
        publish(this.context, DATE_SELECTION_CHANNEL, payload);
      }
    }
  }

  /**
   * @function showNotification
   * @summary show an error notification to prompt the user to pick
   * an end date that's after the start date
   */
  showNotification() {
    const evt = new ShowToastEvent({
      title: "Error Picking Dates",
      message: "Please ensure that the end date is after the start date"
    });
    this.dispatchEvent(evt);
  }
}