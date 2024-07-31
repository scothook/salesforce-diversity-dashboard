import { LightningElement, wire } from 'lwc';
import chartjs from '@salesforce/resourceUrl/chartJs';
import { loadScript } from 'lightning/platformResourceLoader';
import {subscribe, unsubscribe, MessageContext} from 'lightning/messageService';
import EXPORT_DATA_SELECTION_CHANNEL from '@salesforce/messageChannel/ExportDataSelection__c';

export default class DisplayDiversityCharts extends LightningElement {
    genderMessageData = null;
    disabilityMessageData = null;
    title = null;
    headers = null;
    maleData = [];
    femaleData = [];
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
                this.disabilityMessageData = message.disabilityResults;
                console.log("disabilityMessageData: " + this.disabilityMessageData);
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
        console.log(this.femaleData)
        this.monthPairs = this.genderMessageData.map(month => month.monthYear);
        console.log(this.monthPairs);
        console.log(this.genderMessageData);
        console.log(this.disabilityMessageData);
        this.disabilityFalseData = this.disabilityMessageData.map(month => parseFloat(month.false));
        this.disabilityTrueData = this.disabilityMessageData.map(month => parseFloat(month.true));
        
        console.log(this.disabilityFalseData);
        console.log(this.disabilityTrueData);

        //check if chart is initialized
        if (this.charts.genderChart || this.charts.disabilityChart) {
            this.updateChartData();
        }
    }

    updateChartData() {
        // Update chart data
        this.charts.genderChart.data.labels = this.monthPairs;
        this.charts.genderChart.data.datasets[0].data = this.maleData;
        this.charts.genderChart.data.datasets[1].data = this.femaleData;

        this.charts.disabilityChart.data.labels = this.monthPairs;
        this.charts.disabilityChart.data.datasets[0].data = this.disabilityFalseData;
        this.charts.disabilityChart.data.datasets[1].data = this.disabilityTrueData;
    
        // Update the chart
        this.charts.genderChart.update();
        this.charts.disabilityChart.update();
    }

    displayMessage(message) {
        console.log(message ? JSON.stringify(message, null, '\t') : 'no message payload');
    }

    error;
    charts = {
        genderChart: null,
        raceChart: null,
        veteranChart: null,
        disabilityChart: null
    }
    chartjsInitialized = false;

    

    
    async renderedCallback() {
        if (this.chartjsInitialized) {
            if (this.genderMessageData && this.disabilityMessageData) {
                this.updateChartData();
            }
            return;
        }
        this.chartjsInitialized = true;

        //this.createCanvas();

        try {
            await loadScript(this, chartjs);
            this.createCanvas('genderChart');
            //this.createCanvas('raceChart', this.raceChart);
            //this.createCanvas('veteranChart', this.veteranChart);
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
            canvas.width = 600;
            canvas.height = 400;
            this.template.querySelector(`div.${chartClass}`).appendChild(canvas);
            const ctx = canvas.getContext('2d');
            this.charts[chartClass] = new window.Chart(ctx, this.choseConfig(chartClass));
    }

    choseConfig(chartClass) {
        switch(chartClass) {
            case 'genderChart':
                return this.configGender;
            case 'raceChart':
                return this.configRace;
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
                { data: this.maleData, label: 'Male', backgroundColor:'#9BD0F5', borderColor: '#36A2EB' },
                { data: this.femaleData, label: 'Female', borderColor: '#FF6384',
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
    configRace = {
        type: 'line',
        data: {
            labels: this.monthPairs,
            datasets: [
                { data: this.maleData, label: 'Male', backgroundColor:'#9BD0F5', borderColor: '#36A2EB' },
                { data: this.femaleData, label: 'Female', borderColor: '#FF6384',
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
                { data: this.maleData, label: 'Male', backgroundColor:'#9BD0F5', borderColor: '#36A2EB' },
                { data: this.femaleData, label: 'Female', borderColor: '#FF6384',
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
                { data: this.disabilityFalseData, label: 'False', backgroundColor:'#9BD0F5', borderColor: '#36A2EB' },
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