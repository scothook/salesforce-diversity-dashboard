/**
 * @fileoverview This file creates a short list of 10
 * Client records. The user can utilize a search box
 * to find the exact record they're looking for. Once they've made their
 * choice, that choice is sent to the Client Selection Channel.
 * @author Jessica Robertson
 */

import { LightningElement, wire } from "lwc";
import findClientRecords from "@salesforce/apex/ClientLookupController.findClientRecords";
import { publish, MessageContext } from "lightning/messageService";
import CLIENT_SELECTION_CHANNEL from "@salesforce/messageChannel/ClientSelection__c";

/*eslint "@lwc/lwc/no-async-operation": off*/

export default class ClientLookup extends LightningElement {
  // Variables to handle the search results
  searchKey = null;
  searchResults;
  searchError;
  showSpinner = false;
  isDropdownOpen = false;

  // User can type out a partial search key rather than one character
  doneTypingInterval = 750;
  typingTimer;

  // Track the client selection
  selectedClients = [];

  @wire(MessageContext)
  context;

  /**
   * @function clearSearchKey
   * @summary clear the search key and results.
   */
  clearSearchKey() {
    this.searchKey = "";
    this.searchResults = undefined;
  }

  /**
   * @function handleSearchChange
   * @summary As user changes the search key, handle any changes.
   * @description Look for user input on a timer. Update search results accordingly.
   * @param {*} event User types
   */
  handleSearchChange(event) {
    clearTimeout(this.typingTimer);
    this.isDropdownOpen = true;
    this.searchKey = event.target.value;
    this.typingTimer = setTimeout(() => {
      if (this.searchKey) {
        this.showSpinner = true;
        findClientRecords({ searchKey: this.searchKey })
          .then((result) => {
            this.searchResults = result;
            this.showSpinner = false;
          })
          .catch((error) => {
            this.searchResults = undefined;
            this.showSpinner = false;
            this.searchError = error;
          });
      } else {
        this.searchResults = undefined;
      }
    }, this.doneTypingInterval);
  }

  /**
   * @function handleSearchSelect
   * @summary User selects a search result. Selected client is added to array.
   * Search dropdown is closed, search key is reset and triggers handleClientSelect().
   * @param {*} event
   */
  handleSearchSelect(event) {
    const selectedRecordId = event.currentTarget.dataset.id;
    const selectedName =
      event.currentTarget.querySelector(".slds-truncate").textContent;

    this.selectedClients = [
      ...this.selectedClients,
      { id: selectedRecordId, name: selectedName }
    ];

    this.isDropdownOpen = false;
    this.clearSearchKey();
    this.handleClientSelect();
  }

  /**
   * @function handleClientSelect
   * @summary send client Ids and client Names to the Client Selection channel.
   */
  handleClientSelect() {
    const payload = {
      Client_Ids: this.selectedClients.map((client) => client.id),
      Client_Names: this.selectedClients.map((client) => client.name)
    };
    publish(this.context, CLIENT_SELECTION_CHANNEL, payload);
  }

  /**
   * @function removeSelection
   * @summary User can remove any one of the clients in selectedClients.
   * If selectedClients has one or more clients then send updated list to channel.
   * Otherwise, do nothing.
   * @param {*} event Take user input to remove client.
   */
  removeSelection(event) {
    const clientIdToRemove = event.target.dataset.clientId;
    this.selectedClients = this.selectedClients.filter(
      (client) => client.id !== clientIdToRemove
    );

    // Handle the selection update
    if (this.selectedClients.length !== 0) {
      this.handleClientSelect();
    }
  }
}