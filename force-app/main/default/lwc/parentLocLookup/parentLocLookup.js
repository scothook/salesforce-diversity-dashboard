/**
 * @fileoverview This file creates a short list of 10
 * Location Data Parent type records. The user can utilize a search box
 * to find the exact record they're looking for. Once they've made their
 * choice, that choice is sent to the MJC Selection Channel.
 * @author Jessica Robertson
 */

import { LightningElement, wire } from 'lwc';
import findRecords from '@salesforce/apex/LocationDataLookupController.findRecords';
import {publish, MessageContext} from 'lightning/messageService';
import MJC_SELECTION_CHANNEL from '@salesforce/messageChannel/MJCSelection__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

/*eslint "@lwc/lwc/no-async-operation": off*/

export default class locationDataLookup extends LightningElement {
    // User input and results from input
    searchKey = null; searchResults;

    // bools for user visibility
    showSpinner = false; isDropdownOpen = false;

    // Current individual selected record
    selectedLocation = null;

    // All current selected records
    selectedLocations = [];

    // catch any error messages
    searchError;

    // typing delays for search key
    doneTypingInterval = 750; typingTimer;

    @wire(MessageContext)
    context; 

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
                findRecords({ searchKey: this.searchKey })
                    .then(result => {
                        this.searchResults = result;
                        this.showSpinner = false;
                    })
                    .catch(error => {
                        this.searchResults = undefined;
                        this.showSpinner = false;
                        // Handle the error
                        this.searchError = error;
                        this.showErrorNotification();
                    });
            } 
            else {
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
        const selectedRecordId = event.currentTarget.dataset.id;
        const selectedName = event.currentTarget.querySelector('.slds-truncate').textContent;
    
        this.selectedLocations = [
            ...this.selectedLocations, 
            { id: selectedRecordId, name:selectedName}
        ];

        this.isDropdownOpen = false;
        this.clearSearchKey();
        this.handleLocationSelect();
        
    }

    /**
     * @function handleLocationSelect
     * @summary send location Ids and location Names to the MJC Selection channel.
     */
    handleLocationSelect() {
        const payload = {locationIds: this.selectedLocations.map(location => location.id), 
                        locationNames: this.selectedLocations.map(location => location.name)}
        publish(this.context, MJC_SELECTION_CHANNEL, payload);
    }


    
    /**
     * @function removeSelection
     * @summary User can remove any one of the locations in selectedLocations.
     * If selectedLocations has one or more locations then send updated list to channel.
     * Otherwise, do nothing.
     * @param {*} event Take user input to remove location
     */
    removeSelection(event) {
        // User input: Id of Location to Remove
        const locationIdToRemove = event.target.dataset.locationId;

        // Remove the location from the selectedLocations array
        this.selectedLocations = this.selectedLocations.filter(location => location.id !== locationIdToRemove);
        
        // Handle the location selection update
        if (this.selectedLocations.length !== 0) {
            this.handleLocationSelect();
        }
    }

    /**
     * @function showErrorNotification
     * @summary show the user that's there's been a search result error.
     */
    showErrorNotification() {
        const evt = new ShowToastEvent({
            title: "Search Result error",
            message: this.searchError,
        });
        this.dispatchEvent(evt);
    }

    /**
     * @function clearSearchKey
     * @summary clear the search key and results.
     */
    clearSearchKey() {
        this.searchKey = '';
        this.searchResults = undefined;
    }
}