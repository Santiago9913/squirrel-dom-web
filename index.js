"Use Strict";

const URL =
  "https://gist.githubusercontent.com/josejbocanegra/b1873c6b7e732144355bb1627b6895ed/raw/d91df4c8093c23c41dce6292d5c1ffce0f01a68b/newDatalog.json";

const tableElement = `<tr {{className}}>
<th scope="row">{{pos}}</th>
<td>{{event}}</td>
<td>{{squirrel}}</td>
</tr>`;

const corrMap = new Map();
const eventMap = new Map();
const eventCorrMap = new Map();

let events = [];

corrMap.set("TN", 0);
corrMap.set("FN", 0);
corrMap.set("FP", 0);
corrMap.set("TP", 0);

const tableBody = document.getElementById("tableBody");
const tableBodyCorr = document.getElementById("tableBody-corr");

let eventCount = 0;
let total = 348;
let totalSquirrels = 0;
let tnCount = 0;
let fnCount = 0;
let fpCount = 0;
let tpCount = 0;

const calculateMCC = (tp, tn, fp, fn) => {
  let num = tp * tn - fp * fn;
  let den = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));

  return num / den;
};

const getData = async (url) => {
  const data = await fetch(url);
  return data.json();
};

const createList = async () => {
  getData(URL)
    .then((data) => {
      data.map((element, pos) => {
        element.events.forEach((event) => {
          if (!eventMap.has(event)) {
            events.push(event);
            eventMap.set(event, 1);
            eventCorrMap.set(event, new Map());

            if (!element.squirrel) {
              eventCorrMap.get(event).set("FN", 1);
              eventCorrMap.get(event).set("TP", 0);
              eventCorrMap.get(event).set("FP", 0);
              eventCorrMap.get(event).set("TN", 0);
            } else if (element.squirrel) {
              eventCorrMap.get(event).set("FN", 0);
              eventCorrMap.get(event).set("TP", 1);
              eventCorrMap.get(event).set("FP", 0);
              eventCorrMap.get(event).set("TN", 0);
            }
          } else {
            eventCount = eventMap.get(event) + 1;

            if (!element.squirrel) {
              fnCount = eventCorrMap.get(event).get("FN") + 1;

              eventCorrMap.get(event).set("FN", fnCount);
            } else if (element.squirrel) {
              tpCount = eventCorrMap.get(event).get("TP") + 1;

              eventCorrMap.get(event).set("TP", tpCount);
            }

            eventMap.set(event, eventCount);
          }
        });

        let newElement = tableElement;
        newElement = newElement.replace("{{pos}}", pos + 1);
        newElement = newElement.replace("{{event}}", element.events);
        newElement = newElement.replace("{{squirrel}}", element.squirrel);
        if (element.squirrel) {
          newElement = newElement.replace("{{className}}", `class="table-danger"`);
          totalSquirrels += 1;
        } else {
          newElement = newElement.replace("{{className}}", ``);
        }
        tableBody.innerHTML += newElement;
      });

      return events;
    })
    .then((events) => {
      let TN = 0;
      let mcc = 0;
      const fMap = new Map();

      events.map((event, pos) => {
        let subSquirrels = eventCorrMap.get(event).get("TP");
        TN = total - totalSquirrels - eventMap.get(event);
        eventCorrMap.get(event).set("FP", totalSquirrels - subSquirrels);
        eventCorrMap.get(event).set("TN", TN);

        mcc = calculateMCC(
          eventCorrMap.get(event).get("TP"),
          eventCorrMap.get(event).get("TN"),
          eventCorrMap.get(event).get("FP"),
          eventCorrMap.get(event).get("FN")
        );

        fMap.set(event, mcc);
      });

      const mapDesc = new Map(
        [...fMap.entries()].sort(function (a, b) {
          return b[1] - a[1];
        })
      );

      let i = 1;

      for (const [key, val] of mapDesc.entries()) {
        let newElement = tableElement;
        newElement = newElement.replace("{{pos}}", i);
        newElement = newElement.replace("{{className}}", "");
        newElement = newElement.replace("{{event}}", key);
        newElement = newElement.replace("{{squirrel}}", val);
        i += 1;

        tableBodyCorr.innerHTML += newElement;
      }
    });
};

createList();
