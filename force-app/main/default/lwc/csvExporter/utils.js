/**
 * @typedef attritionData
 * @type {object}
 * @property {string} monthYear - Month Year Pair
 * @property {int} som - start of month headcount
 * @property {int} eom - end of month headcount
 * @property {float} aom - average headcount of the month
 * @property {int} voluntary - num of voluntary separations
 * @property {int} involuntary - num of involuntary separations
 * @property {int} totAttrition - num of total separations
 * @property {float} involTurn -  num invol / aom
 * @property {float} volTurn - num vol / aom
 * @property {float} totTurn - num separations / aom
 */

/**
 * @function exportCSVFile
 * @summary Create the csv file and export it
 * @param {attritionData} totalData - data from the attrition report
 * @param {string} fileTitle - Title of the csv file
 * @returns {string} error
 */
export function exportCSVFile(headers, totalData, fileTitle) {
  /**
   * @const {Array.<string>}
   * @description actual headers for csv file
   */
  const keyToHeaderMapping = headers.reduce((acc, current) => {
    acc[current.fieldName] = current.label;
    return acc;
  }, {});
  console.log(keyToHeaderMapping);
  console.log(headers);

  // Make sure that there is data
  if (!totalData || !totalData.length) {
    return "No data found";
  }
  const result = jsonToCSV(totalData, keyToHeaderMapping);

  if (result === null) return "No result";
  const blob = new Blob([result]);
  const exportedFilename = fileTitle ? fileTitle + ".csv" : "export.csv";
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, exportedFilename);
  } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    const link = window.document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(result);
    link.target = "_blank";
    link.download = exportedFilename;
    link.click();
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", exportedFilename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  return "";
}

/**
 * @function jsonToCSV
 * @summary Create the csv string from the data provided
 * @param {attritionData} jsonData - Attrition data
 * @param {Array<string>} keyToHeaderMapping - headers for csv file
 * @returns {string}
 */
function jsonToCSV(jsonData, keyToHeaderMapping) {
  // Parse JSON if it's a string
  if (typeof jsonData === "string") {
    jsonData = JSON.parse(jsonData);
  }

  // Check if jsonData is an array
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return "No result";
  }

  // create the header row
  const csvHeaders = Object.values(keyToHeaderMapping).join(",");

  // Map each JSON key to its corresponding CSV header
  const jsonKeys = Object.keys(keyToHeaderMapping);

  // Map each object to a CSV row
  const csvRows = jsonData
    .map((row) => {
      return jsonKeys
        .map((key) => {
          const value =
            row[key] === null || row[key] === undefined ? "" : row[key];
          return JSON.stringify(value);
        })
        .join(",");
    })
    .join("\n");

  return csvHeaders + "\n" + csvRows;
}