/* eslint no-unused-vars:off, guard-for-in:off, no-loop-func:off*/

export function processInfo(table, fieldName, startDate, endDate) {

    let month_pairs = getMonthYearPairs(startDate, endDate);
    let aggregatedResults = month_pairs.map(() => [0,0])
    let returnOpts = [];

    month_pairs.forEach((pair, i) => {
        let [year, month] = pair.split('-').map(Number);
        let formattedDate = getFormattedMonthYear(new Date(year, month - 1));
        // console.log(formattedDate);

        const recordRow = table.map(record => [record[fieldName], record.Changed_At__c, record.Snapshot_Start_Date__c, record.Snapshot_End_Date__c]);
        let {tableOpts: opts, counts: recCounts} = getMonthlyBreakdown(recordRow, year, month);

        if (i === 0) {
            returnOpts = [{label: 'Month Year', fieldName: 'monthYear'}];
            for (let k = 0; k < opts.length; k++) {
                let tempLabel = opts[k]
                returnOpts = [
                    ...returnOpts, 
                    {label:tempLabel, fieldName: tempLabel}
                ];
            }
        }

        let recordArray = opts.map((row, j) => {
            return {
            [row]: recCounts[j]
        }});
        // console.log(recordArray);
        aggregatedResults[i][0] = formattedDate;
        aggregatedResults[i][1] = recordArray;
        });


    // console.log(aggregatedResults);
    return {aggregatedResults, returnOpts};
}

 /**
     * @function getMonthYearPairs
     * @summary function to create an array of all Month-Year pairs within given data.
     * @param {Date} startDate Start of the Date Range.
     * @param {Date} endDate End of the Date Range.
     * @return {String[]} each Month-Year pair.
     */
    function getMonthYearPairs(startDate, endDate) {
        // turn 'YYYY-MM-DD' into ['YYYY', 'MM', 'DD] to signify that this is the absolute date value and to not take 
        // UTC into account. This applies to both startParts and endParts.
        let startParts = startDate.split('-'); 
        let start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        let endParts = endDate.split('-');
        let end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

        let pairs = [];

        while (start <= end) {
            let year = start.getFullYear();
            let month = start.getMonth() + 1; // Month is 0-indexed
            pairs.push(`${year}-${month < 10 ? '0' : ''}${month}`); // Corrected template literal
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
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
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

        const firstDay = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const lastDay = new Date(year, month, 0, 0, 0, 0, 0);
        return {firstDay, lastDay};
    }

    function getMonthlyBreakdown(table, year, month) {
        let currOpt = table.map(opt => opt[0]);


        const keys = [...new Set(currOpt)];
        let tableOpts = Array.from(keys);
        let counts = Array.from({length: tableOpts.length}, (_,__) => 0);

        // console.log(tableOpts)
        let {firstDay, lastDay} = getMonthBoundaries(year, month);
        // console.log(lastDay);

        for (const record of table) {
            let tempChange; let tempSnapEnd; let tempSnapStart; let snapshot = false; 
            const value = record[0];
            const valIndex = tableOpts.indexOf(value);

            if(record[1]) {
                // example DateTime: 2020-09-15T14:33:15.000Z
                let changePartsDate = record[1].split('T')[0].split('-');
                let changePartsTime = record[1].split('T')[1].split(':');

                tempChange = new Date(changePartsDate[0], changePartsDate[1]-1, changePartsDate[2], changePartsTime[0], changePartsTime[1]);
                // console.log(tempChange)
            }
            if(record[2]) {
                snapshot = true;
                let startPartsDate = record[2].split('T')[0].split('-');
                let startPartsTime = record[2].split('T')[1].split(':');
                tempSnapStart = new Date(startPartsDate[0], startPartsDate[1]-1, startPartsDate[2], startPartsTime[0], startPartsTime[1]);

                if(record[3]) {
                    let endPartsDate = record[3].split('T')[0].split('-');
                    let endPartsTime = record[3].split('T')[1].split(':');
                    tempSnapEnd = new Date(endPartsDate[0], endPartsDate[1]-1, endPartsDate[2], endPartsTime[0], endPartsTime[1]);
                }
            }

            if (snapshot) {
                if(tempSnapStart < firstDay && tempSnapEnd > lastDay) {
                    counts[valIndex] += 1;
                }
                else if (tempSnapStart > firstDay && tempSnapEnd > lastDay) {
                    counts[valIndex] += 1;
                }
            }
            else {
                if (tempChange < lastDay) {
                    counts[valIndex] += 1;
                }
            }

        }
        // console.log(rowcount);
        return {tableOpts, counts};

    }