/**
 * @fileoverview LWC Component that retrieves Division picklist values,
 * shows those options to the user, allows user to choose one or more values,
 * and send those chosen values to the DOM
 * @author Jessica Robertson
 *
 */

import { LightningElement, wire } from "lwc";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import Division__c from "@salesforce/schema/Location_Data__c.Division__c";
import { publish, MessageContext } from "lightning/messageService";
import DIVISION_SELECTED_CHANNEL from "@salesforce/messageChannel/DivisionSelected__c";

/**
 * @summary Class retrieves Division Picklist values then allows user to choose any
 * number of them
 * @extends LightningElement
 */
export default class WireGetDivisionLocData extends LightningElement {
  divisions = [];

  @wire(MessageContext)
  context;

  @wire(getPicklistValues, {
    recordTypeId: "012A0000000GiyVIAS", // Record Type is Parent Location
    fieldApiName: Division__c
  })
  picklistValues;

  /**
   * @function handleCheckboxChange
   * @summary Create division list each time user checks any box
   */
  handleCheckboxChange() {
    try {
      // Query the DOM
    const checked = Array.from(
      this.template.querySelectorAll("lightning-input")
    )
      // Filter to only checked items
      .filter((element) => element.checked)
      // Map to their labels
      .map((element) => element.label);
    this.divisions = checked;
    this.handleDivisionSelect();
    }
    catch(error) {
      console.log(error);
    }
    
  }

  /**
   * @function handleDivisionSelect
   * @summary Send user selections to the division selected channel
   */
  handleDivisionSelect() {
    const payload = { divisions: this.divisions };
    publish(this.context, DIVISION_SELECTED_CHANNEL, payload);
  }
}