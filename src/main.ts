import { dateToJulianDate } from './core/time';

const outputElement = document.getElementById('output');

if (outputElement) {
    const now = new Date();
    const jd = dateToJulianDate(now);
    outputElement.innerText = `The current Julian Date is: ${jd.toFixed(4)}`;
}

console.log("Helios engine started.");