/**
 * @fileoverview LWC Component that retrieves HR Determined Position picklist values,
 * shows those options to the user, allows user to choose one or more values,
 * and send those chosen values to the DOM through a message channel
 * @author Jessica Robertson
 *
 */

import { LightningElement, wire } from "lwc";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import Position_Name_HR_Determined__c from "@salesforce/schema/Employee_Status__c.Position_Name_HR_Determined__c";
import { publish, MessageContext } from "lightning/messageService";
import POSITION_SELECTED_CHANNEL from "@salesforce/messageChannel/PositionSelection__c";

export default class hrTitlePicklistParameter extends LightningElement {
  positions = [];

  @wire(MessageContext)
  context;

  @wire(getPicklistValues, {
    recordTypeId: "012A00000019mTQIAY", // Record Type is Solidified
    fieldApiName: Position_Name_HR_Determined__c
  })
  picklistValues;

  /**
   * @function handleCheckboxChange
   * @summary Create title list each time user checks any box
   */
  handleCheckboxChange() {
    // Query the DOM
    try {
      const checked = Array.from(
        this.template.querySelectorAll("lightning-input")
      )
        // Filter to only checked items
        .filter((element) => element.checked)
        // Map to their labels
        .map((element) => element.label);
      this.positions = checked;
      this.handlePositionSelect();
    }
    catch(error) {
      console.log(error);
    }
    
  }

  /**
   * @function handlePositionSelect
   * @summary Send user selections to the position selected channel
   */
  handlePositionSelect() {
    const payload = { positions: this.positions };
    publish(this.context, POSITION_SELECTED_CHANNEL, payload);
  }
}