/**
 * @fileoverview This LWC grabs data from each other LWC that allows user input
 * and brings it together then sends it all to the createAttritTurnReports LWC
 * @author Jessica Robertson
 */

import { LightningElement, wire } from "lwc";
import { subscribe, MessageContext, publish } from "lightning/messageService";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import Position_Name_HR_Determined__c from "@salesforce/schema/Employee_Status__c.Position_Name_HR_Determined__c";
import Division__c from "@salesforce/schema/Location_Data__c.Division__c";
import getAllRecords from "@salesforce/apex/LocationDataLookupController.getAllRecords";
import getAllClientRecords from "@salesforce/apex/ClientLookupController.getAllClientRecords";
import DIVISION_SELECTED_CHANNEL from "@salesforce/messageChannel/DivisionSelected__c";
import MJC_SELECTION_CHANNEL from "@salesforce/messageChannel/MJCSelection__c";
import CLIENT_SELECTION_CHANNEL from "@salesforce/messageChannel/ClientSelection__c";
import TRANSFER_PARAMETERS_CHANNEL from "@salesforce/messageChannel/transferParameters__c";
import POSITION_SELECTED_CHANNEL from "@salesforce/messageChannel/PositionSelection__c";
import STATE_SELECTED_CHANNEL from "@salesforce/messageChannel/StateSelection__c";
import DATE_SELECTION_CHANNEL from "@salesforce/messageChannel/DateSelection__c";

export default class chooseSearchParameters extends LightningElement {
  // grab all location and client records
  locationRecords = [];
  clientRecords = [];
  positionLabels = [];
  divisionLabels = [];

  // location message variables
  locationIds = [];
  locationNames = [];

  // client message variables
  clientIds = [];
  clientNames = [];

  // message variables
  divisions;
  positions;
  states;

  // date message variables
  startDate;
  endDate;
  dateReceived = false;

  // bools for choices
  showLocTile = false;
  showClientTile = false;
  showDivTile = false;
  showHRTile = false;
  showStateTile = false;
  sentData = false;

  // parameters to send
  divisionArray;
  MJCArray;
  clientArray;
  positionArray;
  title;
  statesArray;

  // get all location records
  @wire(getAllRecords)
  wiredLocationRecords({ error, data }) {
    if (data) {
      this.locationRecords = data.map((record) => record.Id);
    } else if (error) {
      this.locationRecords = [];
    }
  }

  // get all client records
  @wire(getAllClientRecords)
  wiredClientRecords({ error, data }) {
    if (data) {
      this.clientRecords = data.map((record) => record.Id);
    } else if (error) {
      this.clientRecords = [];
    }
  }

  // get all picklist labels
  @wire(getPicklistValues, {
    recordTypeId: "012A00000019mTQIAY", // Record Type is Solidified
    fieldApiName: Position_Name_HR_Determined__c
  })
  positionData({ error, data }) {
    if (data) {
      this.positionLabels = data.values.map((record) => record.label);
    } else if (error) {
      this.positionLabels = [];
    }
  }

  // get all division labels
  @wire(getPicklistValues, {
    recordTypeId: "012A0000000GiyVIAS", // Record Type is Parent Location
    fieldApiName: Division__c
  })
  divisionData({error, data}) {
    if (data) {
      this.divisionLabels = data.values.map((record) => record.label);
    }
  else if (error) {
    this.divisionLabels = [];
  }
  }

  @wire(MessageContext)
  messageContext;

  stateAbbreviations = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "DC",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY"
  ];

  /**
   * @summary get all possible choices for user input
   */
  options = [
    {
      label: "Master Job Code",
      value: "Master Job Code",
      checked: false,
      received: false
    },
    { label: "Division", value: "Division", checked: false, received: false },
    { label: "Client", value: "Client", checked: false, received: false },
    { label: "HR Title", value: "HR Title", checked: false, received: false },
    { label: "Working State", value: "State", checked: false, received: false }
  ];

  /**
   * @function connectedCallback
   * @summary Call subscription methods for each channel
   */
  connectedCallback() {
    this.subscribeToDivisionMessageChannel();
    this.subscribeToDateMessageChannel();
    this.subscribeToLocationMessageChannel();
    this.subscribeToClientMessageChannel();
    this.subscribeToPositionMessageChannel();
    this.subscribeToStateMessageChannel();
  }

  /**
   * @function subscribeToLocationMessageChannel
   * @summary Receive location information
   */
  subscribeToLocationMessageChannel() {
    this.locSubscription = subscribe(
      this.messageContext,
      MJC_SELECTION_CHANNEL,
      (message) => this.handleLocationMessage(message)
    );
  }

  /**
   * @function handleLocationMessage
   * @summary get Location Ids and Names
   * @param {*} message
   */
  handleLocationMessage(message) {
    this.locationIds = message.locationIds;
    this.locationNames = message.locationNames;
    this.updateDataReceived("Master Job Code");
    this.checkForParameters();
  }

  /**
   * @function subscribeToStateMessageChannel
   * @summary Receive state information
   */
  subscribeToStateMessageChannel() {
    this.stateSubscription = subscribe(
      this.messageContext,
      STATE_SELECTED_CHANNEL,
      (message) => this.handleStateMessage(message)
    );
  }

  /**
   * @function handleStateMessage
   * @summary get states
   * @param {*} message
   */
  handleStateMessage(message) {
    this.states = message.states;
    this.updateDataReceived("State");
    this.checkForParameters();
  }

  /**
   * @function subscribeToDivisionMessageChannel
   * @summary Receive division information
   */
  subscribeToDivisionMessageChannel() {
    this.divSubscription = subscribe(
      this.messageContext,
      DIVISION_SELECTED_CHANNEL,
      (message) => this.handleDivisionMessage(message)
    );
  }

  /**
   * @function handleLocationMessage
   * @summary get Location Ids and Names
   * @param {*} message
   */
  handleDivisionMessage(message) {
    this.divisions = message.divisions;
    this.updateDataReceived("Division");
    this.checkForParameters();
  }

  /**
   * @function subscribeToDateMessageChannel
   */
  subscribeToDateMessageChannel() {
    this.dateSubscription = subscribe(
      this.messageContext,
      DATE_SELECTION_CHANNEL,
      (message) => this.handleDateMessage(message)
    );
  }

  /**
   * @function handleDateMessage
   * @summary get start and end dates
   * @param {*} message
   */
  handleDateMessage(message) {
    this.startDate = message.startDate;
    this.endDate = message.endDate;
    this.dateReceived = true;
    this.checkForParameters();
  }

  /**
   * @function subscribeToClientMessageChannel
   * @summary Receive client information
   */
  subscribeToClientMessageChannel() {
    this.clientSubscription = subscribe(
      this.messageContext,
      CLIENT_SELECTION_CHANNEL,
      (message) => this.handleClientMessage(message)
    );
  }

  /**
   * @function handleClientMessage
   * @summary get Client Ids and Names
   * @param {*} message
   */
  handleClientMessage(message) {
    this.clientIds = message.Client_Ids;
    this.clientNames = message.Client_Names;
    this.updateDataReceived("Client");
    this.checkForParameters();
  }

  /**
   * @function subscribeToPositionMessageChannel
   * @summary Receive position information
   */
  subscribeToPositionMessageChannel() {
    this.positionSubscription = subscribe(
      this.messageContext,
      POSITION_SELECTED_CHANNEL,
      (message) => this.handlePositionMessage(message)
    );
  }

  /**
   * @function handlePositionMessage
   * @summary get HR titles
   * @param {*} message
   */
  handlePositionMessage(message) {
    this.positions = message.positions;
    this.updateDataReceived("HR Title");
    this.checkForParameters();
  }

  /**
   * @function displayMessage
   * @summary console log the message received.
   * @param {*} message
   */
  displayMessage(message) {
    console.log(
      message ? JSON.stringify(message, null, "\t") : "no message payload"
    );
  }

  /**
   * @function updateDataReceived
   * @summary When data is received, update received to true
   * @param {*} val option to update
   */
  updateDataReceived(val) {
    this.options = this.options.map((option) => {
      if (option.value === val) {
        // If the option is "Master Job Code", set received to true
        return { ...option, received: true };
      }
      return option;
    });
  }

  /**
   * @function handleCheckboxChange
   * @summary change the boxes displayed based on user input
   * @param {*} event
   */
  handleCheckboxChange(event) {
    const value = event.target.value;
    const checked = event.target.checked;

    // Update the checked state for the option
    this.options = this.options.map((option) => {
      if (option.value === value) {
        return { ...option, checked };
      }
      return option;
    });

    // Reset visibility
    this.showLocTile = false;
    this.showClientTile = false;
    this.showDivTile = false;
    this.showHRTile = false;
    this.showStateTile = false;

    // Iterate over options to update visibility based on the checked state
    this.options.forEach((option) => {
      if (option.checked) {
        if (option.value === "Master Job Code") {
          this.showLocTile = true;
        }
        if (option.value === "Division") {
          this.showDivTile = true;
        }
        if (option.value === "Client") {
          this.showClientTile = true;
        }
        if (option.value === "HR Title") {
          this.showHRTile = true;
        }
        if (option.value === "State") {
          this.showStateTile = true;
        }
      }
    });

    this.checkForParameters();
  }

  /**
   * @function checkForParameters
   * @summary check if a date exists. If there is a date, then assign parameters
   */
  checkForParameters() {
    if (this.dateReceived) {
      this.assignParameters();
    }
  }

  /**
   * @function assignParameters
   * @summary Check to see which parameters were chosen and assign the rest default values
   */
  assignParameters() {
    // Default parameters
    this.divisionArray = this.divisionLabels; // Fallback to all divisions
    this.MJCArray = this.locationRecords; // Fallback to locationRecords
    this.clientArray = this.clientRecords; // Fallback to clientRecords
    this.positionArray = this.positionLabels; // Fallback to all positions
    this.statesArray = this.stateAbbreviations; // Fallback to all states
    this.title = `Report from ${this.startDate} to ${this.endDate}`; // Base Title

    // Update based on checked options
    this.options.forEach((option) => {
      if (option.received && option.checked) {
        switch (option.value) {
          case "Master Job Code":
            this.MJCArray = this.locationIds;
            this.title += ` MJC ${this.locationNames.join(", ")}`;
            this.sendParameters();
            break;
          case "Division":
            this.divisionArray = this.divisions;
            this.title += ` Divisions ${this.divisions.join(", ")}`;
            this.sendParameters();
            break;
          case "Client":
            this.clientArray = this.clientIds;
            this.title += ` Clients ${this.clientNames.join(", ")}`;
            this.sendParameters();
            break;
          case "HR Title":
            this.positionArray = this.positions;
            this.title += ` Titles ${this.positions.join(", ")}`;
            this.sendParameters();
            break;
          case "State":
            this.statesArray = this.states;
            this.title += ` States ${this.states.join(", ")}`;
            this.sendParameters();
            console.log(this.statesArray);
            break;
          default:
            this.sendParameters();
            break;
        }
      }
    });
  }

  /**
   * @function sendParameters
   * @summary once parameters have been set and verified
   * send them to the get reports LWC
   */
  sendParameters() {
    const payload = {
      divisions: this.divisionArray,
      startDate: this.startDate,
      endDate: this.endDate,
      locations: this.MJCArray,
      clients: this.clientArray,
      positions: this.positionArray,
      states: this.statesArray,
      title: this.title
    };

    this.sentData = true;
    publish(this.messageContext, TRANSFER_PARAMETERS_CHANNEL, payload);
  }
}