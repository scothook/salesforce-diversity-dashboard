import { LightningElement, wire } from 'lwc';
import chartjs from '@salesforce/resourceUrl/chartJs';
import { loadScript } from 'lightning/platformResourceLoader';
import {subscribe, unsubscribe, MessageContext} from 'lightning/messageService';
import EXPORT_DATA_SELECTION_CHANNEL from '@salesforce/messageChannel/ExportDataSelection__c';

export default class DisplayDiversityCharts extends LightningElement {
    genderMessageData = null;
    veteranMessageData = null;
    ethnicityMessageData = null;
    disabilityMessageData = null;
    title = null;
    headers = null;

    maleData = [];
    femaleData = [];

    ethnicityWhiteData = [];
    ethnicityAsianData = [];
    ethnicityBlackData = [];
    ethnicityHispanicData = [];
    ethnicityPacificData = [];
    ethnicityAIorANData = [];
    ethnicityAIANData = [];
    ethnicityTwoOrMoreData = [];
    ethnicityNotSpecifiedData = [];
    

    
    veteranIData = [];
    veteranNData = [];
    veteranNoData = [];
    veteranYData = [];
    veteranYesData = [];
    veteranDData = [];
    veteranDeclineData = [];

    disabilityFalseData = [];
    disabilityTrueData = [];
    monthPairs = [];

    @wire(MessageContext)
    context;

    connectedCallback() {
        this.subscribeExportChannel();
    }

    disconnectedCallback() {
        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
    }

    subscribeExportChannel() {
        console.log("subscribed");
        this.subscription = subscribe (
            this.context,
            EXPORT_DATA_SELECTION_CHANNEL,
            (message) => this.handleExportMessage(message)
        );
    }

    handleExportMessage(message) {
        if (message){
                this.headers = message.columns;
                this.genderMessageData = message.genderResults;
                this.ethnicityMessageData = message.ethnicityResults;
                this.veteranMessageData = message.veteranResults;
                this.disabilityMessageData = message.disabilityResults;
                console.log("disabilityMessageData: " + this.ethnicityMessageData);
                this.title = message.title;
                this.displayMessage(message);
                this.createDataSets();
            }
            
    }

    //will need to change
    createDataSets() {
        this.maleData = this.genderMessageData.map(month => parseFloat(month.Male));
        console.log(this.maleData);
        this.femaleData = this.genderMessageData.map(month => parseFloat(month.Female));
        console.log(this.femaleData);
        this.monthPairs = this.genderMessageData.map(month => month.monthYear);
        console.log(this.ethnicityMessageData);

        this.ethnicityWhiteData = this.ethnicityMessageData.map(month => parseFloat(month.White));
        this.ethnicityAsianData = this.ethnicityMessageData.map(month => parseFloat(month.Asian));
        this.ethnicityBlackData = this.ethnicityMessageData.map(month => parseFloat(month["Black or African American"]));
        this.ethnicityHispanicData = this.ethnicityMessageData.map(month => parseFloat(month["Hispanic or Latino"]));
        this.ethnicityTwoOrMoreData = this.ethnicityMessageData.map(month => parseFloat(month["Two or more races"]));
        this.ethnicityNotSpecifiedData = this.ethnicityMessageData.map(month => parseFloat(month["Not specified"]));
        this.ethnicityPacificData = this.ethnicityMessageData.map(month => parseFloat(month["Native Hawaiian or Other Pacific Islander"]));
        this.ethnicityAIorANData = this.ethnicityMessageData.map(month => (parseFloat(month["American Indian or Alaskan Native"])+parseFloat(month["American Indian/Alaskan Native"])));
        //this.ethnicityAIANData = this.ethnicityMessageData.map(month => parseFloat(month["American Indian/Alaskan Native"]));

        this.veteranNData = this.veteranMessageData.map(month => (parseFloat(month.N)+parseFloat(month.No)));
        this.veteranIData = this.veteranMessageData.map(month => parseFloat(month.I));
        this.veteranDData = this.veteranMessageData.map(month => (parseFloat(month.D)+parseFloat(month["Decline to Answer"])));
        //this.veteranNoData = this.veteranMessageData.map(month => parseFloat(month.No));
        this.veteranYData = this.veteranMessageData.map(month => (parseFloat(month.Y)+parseFloat(month.Yes)));
        //this.veteranYesData = this.veteranMessageData.map(month => parseFloat(month.Yes));
        //this.veteranDeclineData = this.veteranMessageData.map(month => parseFloat(month["Decline to Answer"]));
        console.log(this.veteranNData);
        console.log(this.veteranNoData);
        console.log(this.monthPairs);
        console.log(this.genderMessageData);
        console.log(this.disabilityMessageData);
        this.disabilityFalseData = this.disabilityMessageData.map(month => parseFloat(month.false));
        this.disabilityTrueData = this.disabilityMessageData.map(month => parseFloat(month.true));
        
        console.log(this.disabilityFalseData);
        console.log(this.disabilityTrueData);

        //check if chart is initialized
        if (this.charts.genderChart) {
            this.updateChartData();
        }
    }

    updateChartData() {
        // Update chart data
        this.charts.genderChart.data.labels = this.monthPairs;
        this.charts.genderChart.data.datasets[0].data = this.maleData;
        this.charts.genderChart.data.datasets[1].data = this.femaleData;

        this.charts.ethnicityChart.data.labels = this.monthPairs;
        this.charts.ethnicityChart.data.datasets[0].data = this.ethnicityWhiteData;
        this.charts.ethnicityChart.data.datasets[1].data = this.ethnicityAsianData;
        this.charts.ethnicityChart.data.datasets[2].data = this.ethnicityBlackData;
        this.charts.ethnicityChart.data.datasets[3].data = this.ethnicityHispanicData;
        this.charts.ethnicityChart.data.datasets[4].data = this.ethnicityPacificData;
        this.charts.ethnicityChart.data.datasets[5].data = this.ethnicityAIorANData;
        //this.charts.ethnicityChart.data.datasets[6].data = this.ethnicityAIANData;
        this.charts.ethnicityChart.data.datasets[6].data = this.ethnicityTwoOrMoreData;
        this.charts.ethnicityChart.data.datasets[7].data = this.ethnicityNotSpecifiedData;

        this.charts.veteranChart.data.labels = this.monthPairs;
        this.charts.veteranChart.data.datasets[0].data = this.veteranIData;
        this.charts.veteranChart.data.datasets[1].data = this.veteranNData;
        //this.charts.veteranChart.data.datasets[4].data = this.veteranNoData;
        this.charts.veteranChart.data.datasets[2].data = this.veteranYData;
        //this.charts.veteranChart.data.datasets[5].data = this.veteranYesData;
        this.charts.veteranChart.data.datasets[3].data = this.veteranDData;
        //this.charts.veteranChart.data.datasets[6].data = this.veteranDeclineData;
        

        this.charts.disabilityChart.data.labels = this.monthPairs;
        this.charts.disabilityChart.data.datasets[0].data = this.disabilityFalseData;
        this.charts.disabilityChart.data.datasets[1].data = this.disabilityTrueData;
    
        // Update the chart
        this.charts.genderChart.update();
        this.charts.ethnicityChart.update();
        this.charts.veteranChart.update();
        this.charts.disabilityChart.update();
    }

    displayMessage(message) {
        console.log(message ? JSON.stringify(message, null, '\t') : 'no message payload');
    }

    error;
    charts = {
        genderChart: null,
        ethnicityChart: null,
        veteranChart: null,
        disabilityChart: null
    }
    chartjsInitialized = false;

    

    
    async renderedCallback() {
        if (this.chartjsInitialized) {
            if (this.genderMessageData && this.ethnicityMessageData && this.veteranMessageData && this.disabilityMessageData) {
                this.updateChartData();
            }
            return;
        }
        this.chartjsInitialized = true;

        //this.createCanvas();

        try {
            await loadScript(this, chartjs);
            this.createCanvas('genderChart');
            this.createCanvas('ethnicityChart');
            this.createCanvas('veteranChart');
            this.createCanvas('disabilityChart');
            /*
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 400;
            this.template.querySelector('div.genderChart').appendChild(canvas);
            const ctx = canvas.getContext('2d');
            this.chart = new window.Chart(ctx, this.config); */
        } catch (error) {
            this.error = error;
        }
    }

    createCanvas(chartClass) {
            const canvas = document.createElement(`canvas`);
            canvas.width = 800;
            canvas.height = 400;
            this.template.querySelector(`div.${chartClass}`).appendChild(canvas);
            const ctx = canvas.getContext('2d');
            this.charts[chartClass] = new window.Chart(ctx, this.choseConfig(chartClass));
    }

    choseConfig(chartClass) {
        switch(chartClass) {
            case 'genderChart':
                return this.configGender;
            case 'ethnicityChart':
                return this.configEthnicity;
            case 'veteranChart':
                return this.configVeteran;
            case 'disabilityChart':
                return this.configDisability;
        }
    }

    configGender = {
        type: 'line',
        data: {
            labels: this.monthPairs,
            datasets: [
                { data: this.maleData, label: 'Male', borderColor: '#36A2EB', backgroundColor:'#9BD0F5' },
                { data: this.femaleData, label: 'Female', borderColor: '#FF6384', backgroundColor: '#FFB1C1' }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month-Year'
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Employees'
                    }
                }
            },
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Gender",
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    position: 'right'
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
    configEthnicity = {
        type: 'line',
        data: {
            labels: this.monthPairs,
            datasets: [
                { data: this.ethnicityWhiteData, label: 'White', borderColor: '#36A2EB', backgroundColor:'#9BD0F5' },
                { data: this.ethnicityAsianData, label: 'Asian', borderColor: '#FF6384', backgroundColor: '#FFB1C1' },
                { data: this.ethnicityBlackData, label: 'Black', borderColor:'#4BC0C0', backgroundColor: '#A2E8E8' },
                { data: this.ethnicityHispanicData, label: 'Hispanic/Latino', borderColor: '#FFCE56', backgroundColor: '#FFE599'},
                { data: this.ethnicityPacificData, label: 'Hawaiian/Pacific Islander', borderColor:'#9966FF', backgroundColor: '#D1B3FF' },
                { data: this.ethnicityAIorANData, label: 'American Indian/Alaska N.', borderColor: '#FF9F40', backgroundColor: '#FFD1A6'},
                { data: this.ethnicityTwoOrMoreData, label: 'Two Or More', borderColor: '#8D6E63', backgroundColor: '#D7CCC8'},
                { data: this.ethnicityNotSpecifiedData, label: 'Not Specified', borderColor: '#27AE60', backgroundColor: '#7DCEA0'}
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month-Year'
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Employees'
                    }
                }
            },
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Race/Ethnicity",
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    position: 'right'
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
    configVeteran = {
        type: 'line',
        data: {
            labels: this.monthPairs,
            datasets: [
                { data: this.veteranIData, label: 'I', borderColor: '#36A2EB', backgroundColor:'#9BD0F5' },
                { data: this.veteranNData, label: 'N', borderColor: '#FF6384', backgroundColor: '#FFB1C1'},
                { data: this.veteranYData, label: 'Y', borderColor: '#4BC0C0', backgroundColor: '#A2E8E8'},
                { data: this.veteranDData, label: 'D', borderColor: '#FFCE56', backgroundColor: '#FFE599'}
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month-Year'
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Employees'
                    }
                }
            },
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Veteran Status",
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    position: 'right'
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
    configDisability = {
        type: 'line',
        data: {
            labels: this.monthPairs,
            datasets: [
                { data: this.disabilityFalseData, label: 'False', borderColor: '#36A2EB', backgroundColor:'#9BD0F5' },
                { data: this.disabilityTrueData, label: 'True', borderColor: '#FF6384',
                backgroundColor: '#FFB1C1'}
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month-Year'
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Employees'
                    }
                }
            },
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Disability Status",
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    position: 'right'
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
}