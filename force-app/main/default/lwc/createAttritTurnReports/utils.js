/**
 * @fileoverview utils.js allows the getReport.js to do all of the calculations for headcounts
 * and separations within a separate file.
 * @author Jessica Robertson
 */

/**
 * @typedef empStatus
 * @type {object}
 * @property {string} Employee__c   - Contact Id for employee
 * @property {string} Effective_End_Date__c - Effective End Date of Employee Status
 * @property {string} Effective_Start_Date__c - Id of Employee Status
 * @property {string} Id - Effective End Date of Employee Status
 * @property {string} Division__c - Division of Employee
 */
/**@type {empStatus} */
var employees = {};

/**
 * @typedef empInterations
 * @type {object}
 * @property {string} Id - Id of Employee Interaction
 * @property {string} Separation_Date__c - Date of employee separation
 * @property {string} Separation_Type__c   - Employee type of separation
 */
/**@type {empInterations} */
var interactions;

/**
 * @function processHeadcounts
 * @summary Controller function to process headcounts (start of month and end of month) based on given employee data.
 * @param {Date} startVar Start of the Date Range.
 * @param {Date} endVar End of the Date Range.
 * @param {Object[]} employeesVar Employee status data collected. This becomes a global variable.
 * @return {Object[]} headcounts data with the row structure [Month-Year, som, eom].
 */
function processHeadcounts(startVar, endVar, employeesVar) {
  employees = employeesVar;
  let headcounts = getMonthlyHeadcounts(startVar, endVar);
  return headcounts;
}

/**
 * @function getMonthYearPairs
 * @summary function to create an array of all Month-Year pairs within given employee data.
 * @param {Date} startDate Start of the Date Range.
 * @param {Date} endDate End of the Date Range.
 * @param {Object[]} employeesVar Employee data collected.
 * @return {String[]} each Month-Year pair.
 */
function getMonthYearPairs(startDate, endDate) {
  // turn 'YYYY-MM-DD' into ['YYYY', 'MM', 'DD] to signify that this is the absolute date value and to not take
  // UTC into account. This applies to both startParts and endParts.
  let startParts = startDate.split("-");
  let start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  let endParts = endDate.split("-");
  let end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
  let pairs = [];

  while (start.getMonth() === end.getMonth() || start <= end) {
    let year = start.getFullYear();
    let month = start.getMonth() + 1; // Month is 0-indexed
    pairs.push(`${year}-${month < 10 ? "0" : ""}${month}`); // Corrected template literal
    start.setMonth(start.getMonth() + 1);
  }
  return pairs;
}

/**
 * @function getFormattedMonthYear
 * @summary function to create a formatted month-year from a given date.
 * @param {Date} startDate Date to format.
 * @return {String} formatted Month-Year.
 */
function getFormattedMonthYear(date) {
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC"
  ];
  let month = monthNames[date.getMonth()];
  let year = date.getFullYear();
  return `${month}-${year}`; // Corrected template literal
}

/**
 * @function getMonthBoundaries
 * @summary function to find the first and last date in a month.
 * @param {String} year
 * @param {String} month
 * @return {Date[]} first day of the month, last day of the month.
 */
function getMonthBoundaries(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  return { firstDay, lastDay };
}

/**
 * @function calculateMonthHeadcount
 * @summary function to calculate headcount at the start and end of a given month.
 * @param {String} year Date to format.
 * @param {String} month
 * @return {int[]} start headcount, end headcount.
 */
function calculateMonthHeadcount(year, month) {
  let { firstDay, lastDay } = getMonthBoundaries(year, month);
  let som = 0;
  let eom = 0;

  //for each employee, check if they were employed at the start and/or beginning of the month
  employees.forEach((employee) => {
    //turn 'YYYY-MM-DD' into ['YYYY', 'MM', 'DD] to signify that this is the absolute date value and to not take UTC into account
    //create start and end from each employee's effective start date and effective end date
    let startParts = employee.Effective_Start_Date__c.split("-");
    let start = new Date(startParts[0], startParts[1] - 1, startParts[2]);

    let end;
    if (employee.Effective_End_Date__c) {
      let endParts = employee.Effective_End_Date__c.split("-");
      end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    } else {
      end = new Date(9999, 11, 31); // far far future date
    }

    //compare the month boundaries with the start and end effective dates
    if (start <= firstDay && end > firstDay) {
      som++;
    }
    if (start <= lastDay && end > lastDay) {
      eom++;
    }
  });

  return { som, eom }; // Return as an array
}

/**
 * @function getMonthlyHeadcounts
 * @summary get monthly headcounts for a time period.
 * Time period is broken down by getMonthYearPairs and
 * then for each pair, calculateMonthHeadcount will run.
 * @param {Date} startVar Date to start at.
 * @param {Date} endVar Date to end at.
 * @return {int[]} each row is [MonthYear, start headcount, end headcount].
 */
function getMonthlyHeadcounts(startVar, endVar) {
  let monthYearPairs = getMonthYearPairs(startVar, endVar);

  //create array that has a row for each pair
  const headcounts = monthYearPairs.map(() => [0, 0, 0]);

  //iterate through the pairs to determine headcounts
  monthYearPairs.forEach((pair, i) => {
    let [year, month] = pair.split("-").map(Number);
    let { som, eom } = calculateMonthHeadcount(year, month);
    headcounts[i][0] = getFormattedMonthYear(new Date(year, month - 1));
    headcounts[i][1] = som;
    headcounts[i][2] = eom;
  });

  return headcounts;
}

/**
 * @function processSeparations
 * @summary function to get voluntary and involuntary separations from given EIs.
 * @param {Date} startVar Date to start at.
 * @param {Date} endVar Date to end at.
 * @param {Object[]} interactionsVar relevant EI records.
 * @return {int[]} separations data where each row is [MonthYear, voluntary, involuntary].
 */
function processSeparations(startVar, endVar, interactionsVar) {
  interactions = interactionsVar;
  let separations = getMonthlySeparations(startVar, endVar);
  return separations;
}

/**
 * @function getMonthlySeparations
 * @summary to get voluntary and involuntary separations for each month
 * between the two given dates.
 * @param {Date} startVar Date to start at.
 * @param {Date} endVar Date to end at.
 * @return {int[]} separations data where each row is [MonthYear, voluntary, involuntary].
 */
function getMonthlySeparations(startVar, endVar) {
  let sepMnthYearPairs = getMonthYearPairs(startVar, endVar);
  const separations = sepMnthYearPairs.map(() => [0, 0, 0]);

  //for each month-year pair calculate the num of voluntary and involuntary separations
  sepMnthYearPairs.forEach((pair, i) => {
    let [year, month] = pair.split("-").map(Number);
    let { voluntarySep, involuntarySep } = calculateMonthAttrition(year, month);

    separations[i][0] = getFormattedMonthYear(new Date(year, month - 1));
    separations[i][1] = voluntarySep;
    separations[i][2] = involuntarySep;
  });

  return separations;
}

/**
 * @function calculateMonthAttrition
 * @summary get voluntary and involuntary separations for each month
 * between the two given dates.
 * @param {Date} startVar Date to start at.
 * @param {Date} endVar Date to end at.
 * @return {int[]} separations data where each row is [MonthYear, voluntary, involuntary].
 */
function calculateMonthAttrition(year, month) {
  let { firstDay, lastDay } = getMonthBoundaries(year, month);
  let voluntarySep = 0;
  let involuntarySep = 0;

  //check each interaction to see if it's within the month given
  interactions.forEach((interaction) => {
    //turn 'YYYY-MM-DD' into ['YYYY', 'MM', 'DD] to signify that this is the absolute date value and to not take UTC into account
    let sepDateParts = interaction.Separation_Date__c.split("-");
    let sepDate = new Date(
      sepDateParts[0],
      sepDateParts[1] - 1,
      sepDateParts[2]
    );

    if (sepDate >= firstDay && sepDate <= lastDay) {
      if (interaction.Separation_Type__c === "Voluntary") {
        voluntarySep++;
      } else if (interaction.Separation_Type__c === "Involuntary") {
        involuntarySep++;
      }
    }
  });

  return { voluntarySep, involuntarySep };
}

/**
 * @function runCalculations
 * @summary run calculations based on headcount and separation data.
 * @param {Object[]} headcountsVar headcount data.
 * @param {Object[]} separationsVar separation data.
 * @return {Object[]} calculations data.
 */
function runCalculations(headcountsVar, separationsVar) {
  let tempHeadcounts = headcountsVar;
  let tempSeparations = separationsVar;
  let tempMonthPairs = [];

  //get average headcounts first so that they can be used within the loop
  let averages = [];
  tempHeadcounts.forEach((headcount) => {
    let avgheadcount = getAvgHeadcounts(headcount.som, headcount.eom);
    averages.push(avgheadcount);
    tempMonthPairs.push(headcount.monthYear);
  });

  //loop through each row within separation data to run each calculation
  const calculations = tempMonthPairs.map(() => [0, 0, 0, 0, 0, 0]);
  tempSeparations.forEach((separation, i) => {
    let totAttrition = getTotalAttrition(
      separation.voluntary,
      separation.involuntary
    );
    let involTurn = getTurnoverRateInvol(separation.involuntary, averages[i]);
    let volTurn = getTurnoverRateVol(separation.voluntary, averages[i]);
    let totTurn = getTurnoverRateTot(
      separation.voluntary,
      separation.involuntary,
      averages[i]
    );
    calculations[i][0] = tempMonthPairs[i];
    calculations[i][1] = averages[i];
    calculations[i][2] = totAttrition;
    calculations[i][3] = toPercentage(involTurn);
    calculations[i][4] = toPercentage(volTurn);
    calculations[i][5] = toPercentage(totTurn);
  });
  return calculations;
}

/**
 * @function getAvgHeadcounts
 * @summary given the headcount at the beginning and end of the month,
 * calculate the average.
 * @param {int} som
 * @param {int} eom
 * @returns {float} average headcount.
 */
function getAvgHeadcounts(som, eom) {
  let avgom = 0;
  if (som !== 0 || eom !== 0) {
    avgom = (som + eom) / 2;
  }
  return avgom;
}

/**
 * @function getTotalAttrition
 * @summary get total attrition per month -
 * both voluntary and involuntary separations.
 * @param {int} voluntarySep
 * @param {int} involuntarySep
 * @returns {int} total separations.
 */
function getTotalAttrition(voluntarySep, involuntarySep) {
  return voluntarySep + involuntarySep;
}

/**
 * @function getTurnoverRateInvol
 * @summary get an involuntary turnover rate based on involuntary separations and average headcount.
 * @param {int} involuntarySep
 * @param {float} avgom
 * @returns {float} involuntary turnover as a decimal.
 */
function getTurnoverRateInvol(involuntarySep, avgom) {
  let involTurn = 0;
  if (involuntarySep !== 0 && avgom !== 0) {
    involTurn = involuntarySep / avgom;
  }
  return involTurn;
}

/**
 * @function getTurnoverRateVol
 * @summary get a voluntary turnover rate based on voluntary separations and average headcount.
 * @param {int} voluntarySep
 * @param {float} avgom
 * @returns {float} voluntary turnover as a decimal.
 */
function getTurnoverRateVol(voluntarySep, avgom) {
  let volTurn = 0;
  if (voluntarySep !== 0 && avgom !== 0) {
    volTurn = voluntarySep / avgom;
  }
  return volTurn;
}

/**
 * @function getTurnoverRateTot
 * @summary get a total turnover percentage based on separations and average headcount.
 * @param {int} voluntarySep
 * @param {int} involuntarySep
 * @param {float} avgom
 * @returns {float} total turnover as a decimal.
 */
function getTurnoverRateTot(voluntarySep, involuntarySep, avgom) {
  let totTurn = 0;
  if ((voluntarySep !== 0 || involuntarySep !== 0) && avgom !== 0) {
    totTurn = (voluntarySep + involuntarySep) / avgom;
  }
  return totTurn;
}

/**
 * @function toPercentage
 * @summary turn a decimal number into a percentage.
 * @param {float} num
 * @returns {float} num as a percentage.
 */
function toPercentage(num) {
  return (num * 100).toFixed(2);
}

function drilldownEmployeeInteractions(monthYear, interactionsEmp) {
  let interactionData = [];
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC"
  ];

  let dateParts = monthYear.split("-");
  let year = dateParts[1];
  let month = monthNames.indexOf(dateParts[0]) + 1;

  let { firstDay, lastDay } = getMonthBoundaries(year, month);
  interactionsEmp.forEach((record) => {
    let sepDateParts = record.Separation_Date__c.split("-");
    let sepDate = new Date(
      sepDateParts[0],
      sepDateParts[1] - 1,
      sepDateParts[2]
    );

    if (sepDate >= firstDay && sepDate <= lastDay) {
      interactionData = [...interactionData, record];
    }
  });

  return interactionData;
}

export {
  processHeadcounts,
  processSeparations,
  runCalculations,
  drilldownEmployeeInteractions
};