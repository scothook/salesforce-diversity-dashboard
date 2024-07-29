import { LightningElement, wire } from "lwc";
import findConfidentialInfo from "@salesforce/apex/DiversityDashboardController.findConfidentialInfo";
import findVeteranInfo from "@salesforce/apex/DiversityDashboardController.findVeteranInfo";
import findDisabilityInfo from "@salesforce/apex/DiversityDashboardController.findDisabilityInfo";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { processInfo } from "./utils";
import {
  subscribe,
  unsubscribe,
  publish,
  MessageContext
} from "lightning/messageService";
import TRANSFER_PARAMETERS_CHANNEL from "@salesforce/messageChannel/transferParameters__c";

/*eslint array-callback-return:off, no-unused-vars:off */

export default class createDiversityReports extends LightningElement {
  // Search variables
  startDate;
  endDate;
  divisions;
  locations;
  clients;
  positions;
  cities;
  states = [];

  genderResults = [];
  genderColumns = [];
  ethnicityColumns = [];
  ethnicityResults = [];

  // confidential info variables
  confidentialinfo;
  confidentialinfoerrors;
  confidentialArray;
  confidentialEmpty = true;
  confidentialcolumns = [
    { label: "id", value: "id" },
    { label: "Gender__c", value: "Gender__c" },
    { label: "Race_Ethnicity__c", value: "Race_Ethnicity__c" },
    { label: "Changed_At", value: "Changed_At" },
    { label: "Employee__c", value: "Employee__c" },
    { label: "Snapshot_Start_Date__c", value: "Snapshot_Start_Date__c" },
    { label: "Snapshot_End_Date__c", value: "Snapshot_End_Date__c" }
  ];

  //veteran variables
  veteranResults = [];
  veteranColumns = [];
  veteraninfo;
  veteraninfoerrors;
  veteranEmpty = true;

  veterancolumns = [
    { label: "id", value: "id" },
    { label: "Status__c", value: "Status__c" },
    { label: "Changed_At", value: "Changed_At" },
    { label: "Employee__c", value: "Employee__c" },
    { label: "Snapshot_Start_Date__c", value: "Snapshot_Start_Date__c" },
    { label: "Snapshot_End_Date__c", value: "Snapshot_End_Date__c" }
  ];

  //disability variables
  disabilityResults = [];
  disabilityColumns = [];
  disabilityinfo;
  disabilityinfoerrors;
  disabilityEmpty = true;
  disabilitycolumns = [
    { label: "id", value: "id" },
    { label: "Disabled__c", value: "Disabled__c" },
    { label: "Changed_At", value: "Changed_At" },
    { label: "Employee__c", value: "Employee__c" },
    { label: "Snapshot_Start_Date__c", value: "Snapshot_Start_Date__c" },
    { label: "Snapshot_End_Date__c", value: "Snapshot_End_Date__c" }
  ];

  // display bools
  isLoading = false;

  @wire(MessageContext)
  context;

  /**
   * @function connectedCallback
   * @summary call method to subscribe for data
   */
  connectedCallback() {
    this.subscribeParameterChannel();
  }

  /**
   * @function disconnectedCallback
   * @summary unsubscribe the channel
   */
  disconnectedCallback() {
    if (this.subscription) {
      unsubscribe(this.subscription);
      this.subscription = null;
    }
  }

  /**
   * @function subscribeParameterChannel
   * @summary subscribe to the message channel
   */
  subscribeParameterChannel() {
    this.subscription = subscribe(
      this.context,
      TRANSFER_PARAMETERS_CHANNEL,
      (message) => this.handleParameterMessage(message)
    );
  }

  /**
   * @function handleParameterMessage
   * @summary ensure all variables are empty before assigning message data
   * @param {*} message
   */
  handleParameterMessage(message) {
    if (message) {
      // declare all variables for table null
      this.confidentialinfo = null;
      this.veteraninfo = null;
      this.disabilityinfo = null;
      this.disabilityResults = null;
      this.disabilityColumns = null;
      this.veteranResults = null;
      this.veteranColumns = null;
      this.genderResults = null;
      this.genderColumns = null;
      this.ethnicityColumns = null;
      this.ethnicityResults = null;
      this.title = null;

      // assign new search variables
      this.divisions = message.divisions;
      this.startDate = message.startDate;
      this.endDate = message.endDate;
      this.locations = message.locations;
      this.clients = message.clients;
      this.positions = message.positions;
      this.states = message.states;

      this.messageDataReceived = true;
      this.title = message.title;

      // set loading bools
      // this.isLoading = true;
    }
  }

  /**
   * @function displayMessage
   * @summary send message to console log
   * @param {*} message
   */
  displayMessage(message) {
    console.log(
      message ? JSON.stringify(message, null, "\t") : "no message payload"
    );
  }

  @wire(findConfidentialInfo, {
    divisionSelection: "$divisions",
    startDate: "$startDate",
    endDate: "$endDate",
    location: "$locations",
    client: "$clients",
    position: "$positions",
    state: "$states"
  })
  wiredConfidentialInfo({ error, data }) {
    if (data) {
      if (data.length === 0) {
        this.confidentialEmpty = true;
        this.isLoading = false;
      } else {
        this.confidentialinfo = data;
        this.isLoading = false;
        this.confidentialEmpty = false;
        console.log(this.confidentialinfo);
        if (this.confidentialinfo && this.veteraninfo && this.disabilityinfo)
          this.createArrays();
      }

      this.confidentialinfoerrors = undefined;
    } else if (error) {
      this.confidentialinfoerrors = error;
      this.confidentialinfo = undefined;
      this.isLoading = false;
    }
  }

  @wire(findVeteranInfo, {
    divisionSelection: "$divisions",
    startDate: "$startDate",
    endDate: "$endDate",
    location: "$locations",
    client: "$clients",
    position: "$positions",
    state: "$states"
  })
  wiredVeteranInfo({ error, data }) {
    if (data) {
      if (data.length === 0) {
        this.veteranEmpty = true;
        this.isLoading = false;
      } else {
        this.veteraninfo = data;
        this.isLoading = false;
        this.veteranEmpty = false;
        if (this.confidentialinfo && this.veteraninfo && this.disabilityinfo)
          this.createArrays();
      }

      this.veteraninfoerrors = undefined;
    } else if (error) {
      this.veteraninfoerrors = error;
      this.veteraninfo = undefined;
      this.isLoading = false;
    }
  }

  @wire(findDisabilityInfo, {
    divisionSelection: "$divisions",
    startDate: "$startDate",
    endDate: "$endDate",
    location: "$locations",
    client: "$clients",
    position: "$positions",
    state: "$states"
  })
  wiredDisabilityInfo({ error, data }) {
    if (data) {
      if (data.length === 0) {
        this.disabilityEmpty = true;
        this.isLoading = false;
      } else {
        this.disabilityinfo = data;
        this.isLoading = false;
        this.disabilityEmpty = false;
        if (this.confidentialinfo && this.veteraninfo && this.disabilityinfo)
          this.createArrays();
      }

      this.disabilityinfoerrors = undefined;
    } else if (error) {
      this.disabilityinfoerrors = error;
      this.disabilityinfo = undefined;
      this.isLoading = false;
    }
  }

  createArrays() {
    this.createConfidentialArray();
    this.createRaceEthnArray();
    this.createVeteranArray();
    this.createDisabilityArray();
  }

  createConfidentialArray() {
    if (this.confidentialinfo) {
      let { aggregatedResults: currGenderResults, returnOpts: genderOpts } =
        processInfo(
          this.confidentialinfo,
          "Gender__c",
          this.startDate,
          this.endDate
        );
      this.genderColumns = genderOpts;
      this.genderResults = this.createGenericArray(currGenderResults);
    }
  }

  createRaceEthnArray() {
    if (this.confidentialinfo) {
      let { aggregatedResults: currResults, returnOpts: currOpts } =
        processInfo(
          this.confidentialinfo,
          "Race_Ethnicity__c",
          this.startDate,
          this.endDate
        );
      this.ethnicityColumns = currOpts;
      this.ethnicityResults = this.createGenericArray(currResults);
    }
  }

  createVeteranArray() {
    if (this.veteraninfo) {
      let { aggregatedResults: currResults, returnOpts: currOpts } =
        processInfo(
          this.veteraninfo,
          "Status__c",
          this.startDate,
          this.endDate
        );
      this.veteranColumns = currOpts;
      this.veteranResults = this.createGenericArray(currResults);
    }
  }

  createDisabilityArray() {
    if (this.disabilityinfo) {
      let { aggregatedResults: currResults, returnOpts: currOpts } =
        processInfo(
          this.disabilityinfo,
          "Disabled__c",
          this.startDate,
          this.endDate
        );
      this.disabilityColumns = currOpts;
      this.disabilityResults = this.createGenericArray(currResults);
    }
  }

  createGenericArray(aggregatedResults) {
    let results = aggregatedResults.map(([monthYear, counts]) => {
      const countsList = counts.reduce((acc, current) => {
        return { ...acc, ...current };
      }, {});
      return { monthYear: monthYear, ...countsList };
    });
    console.log(results);
    return results;
  }

  /**
   * @function showNotification
   * @summary inform user that there was no data found
   */
  showNotification() {
    const evt = new ShowToastEvent({
      title: "No Data Found",
      message: "Please select new search parameters"
    });
    this.dispatchEvent(evt);
  }
}