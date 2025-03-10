import { LightningElement, wire } from 'lwc';
import chartjs from '@salesforce/resourceUrl/chartJs';
import { loadScript } from 'lightning/platformResourceLoader';
import {subscribe, unsubscribe, MessageContext} from 'lightning/messageService';
import EXPORT_DATA_SELECTION_CHANNEL from '@salesforce/messageChannel/ExportDataSelection__c';
/*eslint array-callback-return:off, no-unused-vars:warn*/


export default class displayCharts extends LightningElement {
    messageData = null;
    title = null;
    headers = null;
    involSepData = [];
    volSepData = [];
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
        this.subscription = subscribe (
            this.context,
            EXPORT_DATA_SELECTION_CHANNEL,
            (message) => this.handleExportMessage(message)
        );
    }

    handleExportMessage(message) {
        if (message){
                this.headers = message.columns;
                this.messageData = message.data;
                this.title = message.title;
                // this.displayMessage(message);
                this.createDataSets();
            }
            
    }

    createDataSets() {
        this.involSepData = this.messageData.map(month => parseFloat(month.involTurn));
        // console.log(this.involSepData);
        this.volSepData = this.messageData.map(month => parseFloat(month.volTurn));
        // console.log(this.volSepData)
        this.monthPairs = this.messageData.map(month => month.monthYear);
        // console.log(this.monthPairs);

        //check if chart is initialized
        if (this.chart) {
            this.updateChartData();
        }
    }

    updateChartData() {
        // Update chart data
        this.chart.data.labels = this.monthPairs;
        this.chart.data.datasets[0].data = this.volSepData;
        this.chart.data.datasets[1].data = this.involSepData;
    
        // Update the chart
        this.chart.update();
    }

    displayMessage(message) {
        console.log(message ? JSON.stringify(message, null, '\t') : 'no message payload');
    }

    error;
    chart;
    chartjsInitialized = false;

    config = {
        type: 'line',
        data: {
            labels: this.monthPairs,
            datasets: [
                { data: this.volSepData, label: 'Voluntary', backgroundColor:'#9BD0F5', borderColor: '#36A2EB' },
                { data: this.involSepData, label: 'Involuntary', borderColor: '#FF6384',
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
                        text: '% Separations'
                    }
                }
            },
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Involuntary vs Voluntary Separation Rates",
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

    
    async renderedCallback() {
        if (this.chartjsInitialized) {
            if (this.messageData) {
                this.updateChartData();
            }
            return;
        }
        this.chartjsInitialized = true;

        try {
            await loadScript(this, chartjs);
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 400;
            this.template.querySelector('div.chart').appendChild(canvas);
            const ctx = canvas.getContext('2d');
            this.chart = new window.Chart(ctx, this.config);
        } catch (error) {
            this.error = error;
        }
    }
}