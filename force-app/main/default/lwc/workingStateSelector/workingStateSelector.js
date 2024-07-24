/**
 * @fileoverview LWC Component that shows all states
 *  to the user, allows user to choose one or more values,
 * and send those chosen values to the DOM
 * @author Jessica Robertson
 */

import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import STATE_SELECTION_CHANNEL from "@salesforce/messageChannel/StateSelection__c";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

/*eslint "@lwc/lwc/no-async-operation": off, no-unused-vars:off*/
const stateAbbreviations = [
  "AL",
  "AK",
  "AS",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FM",
  "FL",
  "GA",
  "GU",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MH",
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
  "MP",
  "OH",
  "OK",
  "OR",
  "PW",
  "PA",
  "PR",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VI",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY"
];

export default class WorkingStateSelector extends LightningElement {
  // User input and results from input
  searchKey = null;
  searchResults;
  

  // bools for user visibility
  showSpinner = false;
  isDropdownOpen = false;

  // Current selected states
  selectedStates = [];

  // catch any error messages
  searchError;

  // typing delays for search key
  doneTypingInterval = 750;
  typingTimer;

  @wire(MessageContext)
  context;

// Method to toggle the dropdown state, e.g., when the input is clicked
toggleDropdown() {
    this.isDropdownOpen = false;
}

  /**
   * @function handleSearchChange
   * @summary As user changes the search key, handle any changes.
   * @description Look for user input on a timer. Update search results accordingly.
   * @param {*} event
   */
  handleSearchChange(event) {
    clearTimeout(this.typingTimer);
    this.isDropdownOpen = true;
    this.searchKey = event.target.value.trim().toUpperCase(); // Ensure uppercase for comparison
    this.typingTimer = setTimeout(() => {
      if (this.searchKey) {
        this.showSpinner = true;

        // Filter state abbreviations based on the search key
        const filteredStates = stateAbbreviations.filter((state) =>
          state.startsWith(this.searchKey)
        );

        this.searchResults = filteredStates;

        this.showSpinner = false;
      } else {
        this.searchResults = undefined;
      }
    }, this.doneTypingInterval);
  }

  /**
   * @function handleSelect
   * @summary User selects a search result. Selected location is added to array.
   * Search dropdown is closed, search key is reset and triggers handleLocationSelect().
   * @param {*} event
   */
  handleSelect(event) {
    const selectedState = event.currentTarget.dataset.id;
    console.log(selectedState);

    this.selectedStates = [...this.selectedStates, selectedState];
    console.log(this.selectedStates);

    this.handleStateSelect();
    this.isDropdownOpen = false;
    this.clearSearchKey();
  }

  /**
   * @function handleStateSelect
   * @summary send states to the State Selection channel.
   */
  handleStateSelect() {
    const payload = { states: this.selectedStates };
    publish(this.context, STATE_SELECTION_CHANNEL, payload);
  }

  /**
   * @function removeStateSelection
   * @summary User can remove any one of the states in selectedStates.
   * If selectedStates has one or more states then send updated list to channel.
   * Otherwise, do nothing.
   * @param {*} event Take user input to remove location
   */
  removeStateSelection(event) {
    // User input: Id of Location to Remove
    const stateToRemove = event.currentTarget.dataset.id;

    // Remove the location from the selectedStates array
    this.selectedStates = this.selectedStates.filter(
      (state) => state !== stateToRemove
    );

    // Handle the state selection update
    if (this.selectedStates.length !== 0) {
      this.handleStateSelect();
    }
  }

  /**
   * @function showErrorNotification
   * @summary show the user that's there's been a search result error.
   */
  showErrorNotification() {
    const evt = new ShowToastEvent({
      title: "Search Result error",
      message: this.searchError
    });
    this.dispatchEvent(evt);
  }

  /**
   * @function clearSearchKey
   * @summary clear the search key and results.
   */
  clearSearchKey() {
    this.searchKey = "";
    this.searchResults = undefined;
  }
}