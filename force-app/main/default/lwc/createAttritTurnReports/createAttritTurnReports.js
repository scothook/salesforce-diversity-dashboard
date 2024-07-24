/**
 * @fileoverview Master controller to generate Attrition and Turnover Rates
 * based on Employee Status and Employee Interactions
 * @author Jessica Robertson
 */

import { LightningElement, wire } from "lwc";
import findEmployeeStatusList from "@salesforce/apex/EmployeeStatusController.findEmployeeStatusList";
import getEIRecords from "@salesforce/apex/EmployeeInteractionController.getEIRecords";
import {
  processHeadcounts,
  processSeparations,
  runCalculations,
  drilldownEmployeeInteractions
} from "./utils";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import {
  subscribe,
  unsubscribe,
  publish,
  MessageContext
} from "lightning/messageService";
import TRANSFER_PARAMETERS_CHANNEL from "@salesforce/messageChannel/transferParameters__c";
import EXPORT_DATA_SELECTION_CHANNEL from "@salesforce/messageChannel/ExportDataSelection__c";

/*eslint array-callback-return: off, no-unused-vars:off*/

export default class getReports extends LightningElement {
  // These are the columns that show on the drilldown
  interactColumns = [
    {
      label: "EI",
      fieldName: "nameUrl",
      type: "url",
      typeAttributes: { label: { fieldName: "Name" } }
    },
    {
      label: "Separation Date",
      fieldName: "Separation_Date__c",
      sortable: true
    },
    {
      label: "Separation Type",
      fieldName: "Separation_Type__c",
      sortable: true
    },
    { label: "Employee Name", fieldName: "Employee_Name", sortable: true },
    { label: "Employee Title", fieldName: "Employee_Position", sortable: true },
    {
      label: "Separation Reason",
      fieldName: "Separation_Primary_Reason__c",
      sortable: true
    },
    { label: "Job Location", fieldName: "Location_Name", sortable: true },
    { label: "City", fieldName: "working_city", sortable: true },
    { label: "State", fieldName: "working_state", sortable: true },
    { label: "Supervisor", fieldName: "supervisor__c", sortable: true },
    { label: "Rehire?", fieldName: "rehire__c", sortable: true },
    { label: "Rehire Non-Eligible", fieldName: "rehire_eligibility", sortable: true }
  ];

  /* All fields selected for each EI
    Id, Separation_Date__c, Separation_Type__c, Employee_Contact__r.Name, 
    Employee_Contact__r.Current_Status__r.Position_Name_HR_Determined__c, 
    Separation_Primary_Reason__c, Location__r.Name, 
    Location__r.Client_Account__r.Name
  */

  // Employee Status variables
  employees = null;
  error = null;

  // Employee Interaction variables
  interactions = null;
  interror = null;

  // bools to help with page loading
  isLoading = true;
  isStatusEmptyResponse = false;
  isIntEmptyResponse = false;
  loadedReport = false;
  messageDataReceived = false;

  // Search variables
  startDate;
  endDate;
  divisions;
  locations;
  clients;
  positions;
  cities;
  states = [];

  // Processed data
  headcountData = null;
  calculationData = null;
  combinedData = null;
  allcolumns = {};
  selectedRows = null;
  selectedInteractions = null;

  // sort interactions
  sortedDirection = 'asc';
  sortedBy;

  // export variables
  title;

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
   * @function renderedCallback
   * @summary check if employees and interactions have loaded while the report has not
   */
  renderedCallback() {
    if (
      this.isIntEmptyResponse === false &&
      this.isStatusEmptyResponse === false &&
      this.loadedReport === false
    ) {
      this.loadReport();
      this.loadedReport = true;
    }
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
      this.employees = null;
      this.interactions = null;
      this.combinedData = null;
      this.allcolumns = {};
      this.headcountData = null;
      this.separationData = null;
      this.calculationData = null;
      this.selectedRows = null;
      this.selectedInteractions = null;
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
      this.isLoading = true;
      this.loadedReport = false;
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

  @wire(getEIRecords, {
    divisionSelection: "$divisions",
    startDate: "$startDate",
    endDate: "$endDate",
    location: "$locations",
    client: "$clients",
    position: "$positions",
    state: "$states"
  })
  wiredInteractions({ error, data }) {
    if (data) {
      if (data.length === 0) {
        this.isIntEmptyResponse = true;
        this.isLoading = false;
        if (this.messageDataReceived && this.employees) {
          this.loadReport();
        }
      } else {
        this.interactions = data;
        this.isLoading = false;
        this.isIntEmptyResponse = false;
        if (data && this.messageDataReceived && this.employees) {
          this.loadReport();
        }
      }

      this.error = undefined;
    } else if (error) {
      this.interror = error;
      this.interactions = undefined;
      this.isLoading = false;
    }
  }

  @wire(findEmployeeStatusList, {
    divisionSelection: "$divisions",
    startDate: "$startDate",
    endDate: "$endDate",
    location: "$locations",
    client: "$clients",
    position: "$positions",
    state: "$states"
  })
  wiredEmployees({ error, data }) {
    if (data) {
      if (data.length === 0) {
        this.isStatusEmptyResponse = true;
        this.isLoading = false;
        console.log("empty");
      } else {
        this.employees = data;
        this.isLoading = false;
        this.isStatusEmptyResponse = false;
        if (data && this.messageDataReceived) {
          this.loadReport();
        }
      }
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.employees = undefined;
      this.isLoading = false;
    }
  }

  /**
   * @function loadReport
   * @summary check to see if data is present and then create the table
   */
  loadReport() {
    this.isLoading = true;
    if (this.employees && this.messageDataReceived) {
      this.createHeadcountObject();
      if (this.isIntEmptyResponse === false) this.createInteractionObject();
      this.combineObjects();
      this.isLoading = false;
      this.sendData();
    } else this.isLoading = false;
  }

  /**
   * @function handleRowSelection
   * @summary users can select rows to see the associated
   * EI data
   * @param {*} event
   */
  handleRowSelection(event) {
    const selectedRows = event.detail.selectedRows;
    this.selectedInteractions = null;

    if (selectedRows.length !== 0) {
      this.selectedInteractions = [];
      for (let i = 0; i < selectedRows.length; i++) {
        console.log(selectedRows[i]);
        const currRow = drilldownEmployeeInteractions(
          selectedRows[i].monthYear,
          this.interactions
        );

        const addRow = currRow.map((record) => {
          return {
            Name: record.Name,
            nameUrl: `/${record.Id}`,
            Separation_Date__c: record.Separation_Date__c,
            Separation_Type__c: record.Separation_Type__c,
            Employee_Name: record.Employee_Contact__r.Name,
            Employee_Position:
              record.Employee_Contact__r.Current_Status__r
                .Position_Name_HR_Determined__c,
            Separation_Primary_Reason__c: record.Separation_Primary_Reason__c,
            Location_Name: record.Location__r.Name,
            Location_Client_Name: record.Location__r.Client_Account__r.Name,
            working_city: record.Issued_Working_City__c,
            working_state: record.Issued_Working_State__c,
            supervisor__c: record.Supervisor__r.Name,
            rehire__c: record.Eligible_for_Rehire__c,
            rehire_eligibility: record.Not_Eligible_for_Rehire_Reason__c
          };
        });

        addRow.forEach((row) => {
          this.selectedInteractions = [...this.selectedInteractions, row];
        });
      }
    }
  }

  /**
   * @function updateColumnSorting
   * @summary change which column is sort by
   * @param {*} event
   */
  updateColumnSorting(event) {
    this.sortedBy = event.detail.fieldName;
    this.sortedDirection = event.detail.sortDirection;
    try {
    // assign the latest attribute with the sorted column fieldName and sorted direction
    this.selectedInteractions = this.sortData(this.sortedBy, this.sortedDirection);
    }
    catch(error) {
      console.log(error);
    }
    
  }

  sortData(fieldName, sortDirection) {
    let sortedData = [...this.selectedInteractions];

    sortedData.sort((a, b) => {
      let valueA = (a[fieldName]);
            let valueB = (b[fieldName]);

            let direction = sortDirection === 'asc' ? 1 : -1;

            if (valueA < valueB) {
                return -1 * direction;
            } else if (valueA > valueB) {
                return 1 * direction;
            }
            return 0;
    })

    return sortedData;
  }

  /**
   * @function createHeadcountObject
   * @summary using the employee data, use util functions to process the data
   */
  createHeadcountObject() {
    if (this.employees) {
      let headcounts = {};
      headcounts = processHeadcounts(
        this.startDate,
        this.endDate,
        this.employees
      );

      this.headcountData = headcounts.map((row) => {
        return {
          monthYear: row[0],
          som: row[1],
          eom: row[2]
        };
      });
    }
  }

  /**
   * @function createInteractionObject
   * @summary using the interaction data, use util functions to process the data
   */
  createInteractionObject() {
    if (this.isIntEmptyResponse === false) {
      let separations = {};
      separations = processSeparations(
        this.startDate,
        this.endDate,
        this.interactions
      );

      this.separationData = separations.map((row) => {
        return {
          monthYear2: row[0],
          voluntary: row[1],
          involuntary: row[2]
        };
      });
    } else {
      this.separationData = {};
    }
  }

  /**
   * @function combineObjects
   * @summary create columns for attrition table then join the
   * calculations, interactionData and headcountData on Month-Year
   */
  combineObjects() {
    this.allcolumns = [
      { label: "Month-Year", fieldName: "monthYear" },
      { label: "SOM", fieldName: "som" },
      { label: "EOM", fieldName: "eom" },
      { label: "Avg OM", fieldName: "aom" },
      { label: "Voluntary Separations", fieldName: "voluntary" },
      { label: "Involuntary Separations", fieldName: "involuntary" },
      { label: "Total Separations", fieldName: "totAttrition" },
      { label: "Involuntary Turnover", fieldName: "involTurn" },
      { label: "Voluntary Turnover", fieldName: "volTurn" },
      { label: "Total Turnover", fieldName: "totTurn" }
    ];

    if (this.isIntEmptyResponse === true) {
      console.log(this.headcountData);
      this.combinedData = this.headcountData.map((headcount) => {
        return {
          monthYear: headcount.monthYear,
          som: headcount.som,
          eom: headcount.eom,
          aom: (headcount.som + headcount.eom) / 2,
          voluntary: 0,
          involuntary: 0,
          totAttrition: 0,
          involTurn: 0,
          volTurn: 0,
          totTurn: 0
        };
      });
      // console.log(this.calculationData)
    } else {
      const calculations = runCalculations(
        this.headcountData,
        this.separationData
      );
      this.calculationData = calculations.map((row) => {
        return {
          monthYear3: row[0],
          aom: row[1],
          totAttrition: row[2],
          involTurn: row[3],
          volTurn: row[4],
          totTurn: row[5]
        };
      });

      this.combinedData = this.headcountData.map((headcount) => {
        // Find the matching separation data
        let matchingSeparation = this.separationData.find(
          (separation) => separation.monthYear2 === headcount.monthYear
        );

        // If a matching separation is found, merge the data
        if (matchingSeparation) {
          let matchingCalculation = this.calculationData.find(
            (calculate) =>
              calculate.monthYear3 === matchingSeparation.monthYear2
          );
          if (matchingCalculation) {
            return {
              monthYear: headcount.monthYear,
              som: headcount.som,
              eom: headcount.eom,
              aom: matchingCalculation.aom,
              voluntary: matchingSeparation.voluntary,
              involuntary: matchingSeparation.involuntary,
              totAttrition: matchingCalculation.totAttrition,
              involTurn: matchingCalculation.involTurn,
              volTurn: matchingCalculation.volTurn,
              totTurn: matchingCalculation.totTurn
            };
          }
          return {
            monthYear: headcount.monthYear,
            som: headcount.som,
            eom: headcount.eom,
            aom: 0,
            voluntary: matchingSeparation.voluntary,
            involuntary: matchingSeparation.involuntary,
            totAttrition: 0,
            involTurn: 0,
            volTurn: 0,
            totTurn: 0
          };
        }

        // If no matching separation is found, return headcount data with zeros for separation data
        return {
          monthYear: headcount.monthYear,
          som: headcount.som,
          eom: headcount.eom,
          aom: 0,
          voluntary: 0,
          involuntary: 0,
          totAttrition: 0,
          involTurn: 0,
          volTurn: 0,
          totTurn: 0
        };
      });
    }
  }

  /**
   * @function sendData
   * @summary once data has been generated, send it to the export data channel
   */
  sendData() {
    const payload = {
      columns: this.allcolumns,
      data: this.combinedData,
      title: this.title
    };
    // console.log(JSON.stringify(payload));
    publish(this.context, EXPORT_DATA_SELECTION_CHANNEL, payload);
    // console.log("Published");
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