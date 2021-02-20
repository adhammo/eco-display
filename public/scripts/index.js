const db = firebase.firestore();

let unsubscribe = null;
const startListen = () => {
  if (unsubscribe) return;
  console.log("[display]: listening to temperature changes.");

  unsubscribe = db
    .collection("temperature")
    .orderBy("stamp", "desc")
    .limit(20)
    .onSnapshot(
      (snapshot) => {
        console.log("[display]: temperature change received.");

        const values = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") values.push(change.doc.data().data);
        });

        if (values.length) {
          Plotly.extendTraces(chart, { y: [values.reverse()] }, [0]);

          const dataSize = chart.data[0].y.length;
          Plotly.relayout(chart, {
            xaxis: {
              range: [dataSize - 20, dataSize],
            },
          });
        }
      },
      (err) => {
        console.log(`[display]: listening error (${err.name}: ${err.message}).`);
      }
    );
};

const stopListen = () => {
  if (!unsubscribe) return;
  unsubscribe();
  unsubscribe = null;

  console.log("[display]: stopped listening to temperature changes.");
};

window.addEventListener("DOMContentLoaded", () => {
  const chart = document.getElementById("chart");
  const live = document.getElementById("live");

  let isLive = true;
  live.addEventListener("click", () => {
    const label = live.querySelector("._label");
    const icon = live.querySelector("._icon");

    if (isLive) {
      live.classList.remove("is-danger");
      live.classList.add("is-light");
      label.innerHTML = "Go live";
      icon.innerHTML = "contactless";
      stopListen();
    } else {
      live.classList.remove("is-light");
      live.classList.add("is-danger");
      label.innerHTML = "Stop";
      icon.innerHTML = "pan_tool";
      Plotly.deleteTraces(chart, 0);
      Plotly.addTraces(chart, {
        type: "scatter",
        y: [],
        marker: {
          color: "#222",
          size: 4,
        },
        line: {
          color: "#222",
          width: 2,
        },
      });
      startListen();
    }
    isLive = !isLive;
  });

  console.log("[display]: configured live button.");

  const layout = {
    font: { size: 14 },
    margin: { t: 30, b: 30, l: 60, r: 30, pad: 10 },
    autosize: true,
    xaxis: {
      rangemode: "nonnegative",
      fixedrange: true,
      zeroline: false,
    },
    yaxis: {
      title: "Temperature (&deg;C)",
      range: [0, 50],
      rangemode: "nonnegative",
      fixedrange: true,
    },
  };

  const config = { responsive: true, scrollZoom: true, displayModeBar: true };

  Plotly.newPlot(
    chart,
    [
      {
        type: "scatter",
        y: [],
        marker: {
          color: "#222",
          size: 4,
        },
        line: {
          color: "#222",
          width: 2,
        },
      },
    ],
    layout,
    config
  );

  console.log("[display]: created chart.");

  startListen();
});
