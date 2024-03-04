import "core-js/stable";
import "regenerator-runtime/runtime";
// import * as model from "./model.js";

// TODO:
// - graf, dodać temperature itp
// - weather info 12 hour i 5 dni
// - przyciski obok pogody do zmiany grafu na 12 hour i 5 dni
// - dodać żeby w tym boxie przy hoverze była tylko temperatura
// - ogarnąć jeszcze funkcje getJSON ładnie

// GEOLOCATION
const geolocationBtn = document.querySelector(".geolocation--btn");

// CITY INFO
const cityInfoName = document.querySelector(".city-info--name");
const cityInfoDate = document.querySelector(".city-info--date");

// WEATHER INFO
const weatherInfoTemp = document.querySelector(".temp-value");
const weatherInfoCloud = document.querySelector(".weather-info--cloud");
const weatherInfoRain = document.querySelector(".rain-value");
// secondary
const weatherInfoApparent = document.querySelector(".apparent-value");
const weatherInfoPressure = document.querySelector(".pressure-value");
const weatherInfoWind = document.querySelector(".wind-value");

const weatherInfoImg = document.querySelector(".weather-info--img");

// 12 hour & 5 days buttons
const weatherInfo12HourBtn = document.querySelector(
  ".weather-info--12hour-btn"
);
const weatherInfo5DayBtn = document.querySelector(".weather-info--5day-btn");

// SEARCH BAR
const searchBar = document.querySelector(".search-bar");
const searchBtn = document.querySelector(".search-bar--btn");

// ERROR
const errorLabel = document.querySelector(".error--label");
const errorLabelButton = document.querySelector(".error--label-close-btn");
const errorLabelMessage = document.querySelector(".error--label-message");

// DARK MODE
const darkModeBtn = document.querySelector(".change-mode--btn");
const root = document.documentElement;
const darkMode = localStorage.getItem("dark-mode");

// ----------------- CURRENT WEATHER INFO -----------------

const setWeatherInfo = async function (city) {
  try {
    getFullDate();
    await getLocationKey(city);
    if (!locationKey) throw new Error("Invalid Location Key");
    setCurrentCity(city);
    const [currentWeather] = await getJSON(currentWeatherURL);
    setCurrentWeather(currentWeather);
    await setChart(12);
  } catch (err) {
    displayErrorLabel(err.message);
  }
};

// takes data.WeatherIcon as argument
const getWeatherState = function (icon) {
  if (icon >= 1 && icon <= 2) return "sunny";
  if (icon >= 3 && icon <= 5) return "partly_cloudy_day";
  if (icon >= 6 && icon <= 8) return "cloud";
  if (icon === 11) return "foggy";
  if ((icon >= 12 && icon <= 14) || (icon >= 18 && icon <= 21)) return "rainy";
  if (icon >= 15 && icon <= 17) return "thunderstorm";
  if (icon >= 22 && icon <= 24) return "cloudy_snowing";
  if (icon === 25 || icon === 29) return "weather_mix";
  if (icon === 26) return "weather_hail";
  if (icon === 30) return "heat";
  if (icon === 31) return "severe_cold";
  if (icon === 32) return "air";
  if (icon === 33) return "clear_night";
  return "partly_cloudy_night";
};

const setCurrentWeatherState = function (data) {
  weatherInfoImg.textContent = getWeatherState(data.WeatherIcon);
};

let defaultCity = "Warszawa"; // global default city, when geolacation fails
let locationKey = 0; // global location key, to only run getLocationKey function once
let currentWeatherURL;
let forecast12hourURL;
let forecast5dayURL;
let reverseGeolocationURL;

// finds the location key of the city and sets the urls for other APIs
const getLocationKey = async function (city) {
  try {
    const res = await fetch(
      `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&q=${city}&language=pl`
    );
    if (!res.ok) throw new Error("Failed to fetch.");
    const data = await res.json();
    locationKey = data[0].Key;
    currentWeatherURL = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&language=pl&details=true`;
    forecast12hourURL = `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${locationKey}?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&language=pl&metric=true`;
    forecast5dayURL = `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&language=pl&metric=true`;
  } catch (err) {
    displayErrorLabel("Nie udało się znaleźć miejscowości.");
  }
};

const getJSON = async function (url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch.");
    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

const setCurrentWeather = function (data) {
  // console.log(data);
  weatherInfoTemp.textContent = Math.round(data.Temperature.Metric.Value);
  weatherInfoCloud.textContent = data.WeatherText;
  weatherInfoRain.textContent = data.Precip1hr.Metric.Value;
  weatherInfoApparent.textContent = Math.round(
    data.RealFeelTemperature.Metric.Value
  );
  weatherInfoPressure.textContent = data.Pressure.Metric.Value;
  weatherInfoWind.textContent = Math.round(data.Wind.Speed.Metric.Value);
  setCurrentWeatherState(data);
};

// ----------------- 12 HOUR WEATHER INFO ---------------------

// ----------------- GEOLOCATION -----------------

const geolocationPositive = async function (position) {
  try {
    const { latitude, longitude } = position.coords;
    reverseGeolocationURL = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    // 1. setWeatherToCurrentLocation
    const data = await getJSON(reverseGeolocationURL);
    const city = data.address?.city;
    await setWeatherInfo(city);
  } catch (err) {
    displayErrorLabel(err.message);
  }
};

const geolocationNegative = async function () {
  displayErrorLabel(
    "Nie udało się uzyskać Twojej lokalizacji. Zmień ustawienia w przeglądarce."
  );
  // set weather to default city
  await setWeatherInfo(defaultCity);
};

const getGeolocation = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      geolocationPositive,
      geolocationNegative
    );
  }
};

// const reverseGeocoding = async function (lat, long) {
//   try {
//     const res = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`
//     );
//     const data = await res.json();
//     const city = data.address?.city;
//     return city;
//   } catch (err) {
//     console.log(err.message);
//     displayErrorLabel("Nie udało się odnaleźć twojej lokalizacji.");
//   }
// };

geolocationBtn.addEventListener("click", getGeolocation);

// ----------------- CITY INFO -----------------

const setCurrentCity = function (city) {
  cityInfoName.textContent = city;
};

const getFullDate = function () {
  const now = new Date();
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  };

  cityInfoDate.textContent = Intl.DateTimeFormat("pl", options).format(now);
};

// ----------------- SEARCH BAR ----------------

google.maps.event.addDomListener(window, "load", initialize);
function initialize() {
  const input = document.getElementById("autocomplete");
  new google.maps.places.Autocomplete(input, {
    types: ["(cities)"],
  });
}

const search = async function () {
  try {
    if (searchBar.value === "") throw new Error("Pole wyszukiwania jest puste");
    const city = searchBar.value.trim().split(",")[0];
    const cityCorrected = city[0].toUpperCase(0) + city.slice(1);
    searchBar.value = "";
    setWeatherInfo(cityCorrected);
  } catch (err) {
    displayErrorLabel("Coś poszło nie tak.");
  }
};

searchBar.addEventListener("search", search);
searchBtn.addEventListener("click", search);

// ----------------- ERROR HANDLING -------------------

const hideErrorLabel = function () {
  errorLabel.style.display = "none";
};

const displayErrorLabel = function (message) {
  errorLabel.style.display = "flex";
  errorLabelMessage.textContent = message;

  errorLabelButton.addEventListener("click", hideErrorLabel);

  setTimeout(hideErrorLabel, 10000);
};

// ----------------- CLOCK -------------------

const clockContent = document.querySelector(".clock--content");

const updateClock = function () {
  const date = new Date();
  const hours = date.getHours() >= 10 ? date.getHours() : "0" + date.getHours();
  const minutes =
    date.getMinutes() >= 10 ? date.getMinutes() : "0" + date.getMinutes();
  const currentTime = `${hours}:${minutes}`;
  clockContent.textContent = currentTime;
};

setInterval(updateClock, 1000);

// ----------------- DARK MODE -------------------

darkModeBtn.addEventListener("click", () => {
  root.classList.toggle("dark-theme");

  if (root.classList.contains("dark-theme")) {
    localStorage.setItem("dark-mode", true);
  } else {
    localStorage.removeItem("dark-mode");
  }
});

// ----------------- CHART ---------------------

// console.log(Chart.defaults);
// Chart.defaults.global.defaultFontSize = 16;
// Chart.defaults.global.defaultFontColor =
//   getComputedStyle(root).getPropertyValue("--text-color");

const reloadChart = function () {
  const parent = document.querySelector(".weather-chart--container");
  const oldCanvas = document.getElementById("weatherChart");
  oldCanvas.remove();
  const newCanvas = `<canvas
  id="weatherChart"
  style="width: 100%; height: 100%"
  ></canvas>`;

  parent.insertAdjacentHTML("afterbegin", newCanvas);
};

const setChart = async function (type) {
  // let titleTooltip = [8, 2, 1, 4, 2, 3, 4, 1, 2, 3, 11, 2];
  const xValues = getXValues(type);
  const yValues = await getYValues(type);
  const ymin = Math.round(Math.min(...yValues));
  const ymax = Math.round(Math.max(...yValues));
  const barColor = getComputedStyle(root).getPropertyValue("--chart-bar-color");

  const data = {
    labels: xValues,
    datasets: [
      {
        backgroundColor: barColor,
        data: yValues,
        fill: false,
        borderWidth: 3,
        borderColor: barColor,
        pointHoverRadius: 6,
      },
    ],
  };
  const config = {
    type: "line",
    data,
    options: {
      legend: false,
      "scales[y]": {
        // TUTAJ COŚ SIE ZJEBAŁO CHYBA
        ticks: {
          min: ymin - 3,
          max: ymax + 3,
          stepSize: 1,
        },
      },
      plugins: {
        tooltip: {
          yAlign: "bottom",
          displayColors: false,
          callbacks: {
            // title: titleTooltip,
          },
        },
      },
    },
  };

  new Chart(document.getElementById("weatherChart"), config);
};

const getXValues = function (count) {
  const xValues = [];
  const date = new Date();
  if (count === 12) {
    let hours = date.getHours() + 1;
    let addHour = 0;
    for (let i = 0; i < count; i++) {
      if (hours + addHour >= 24) {
        hours = 0;
        addHour = 0;
      }
      xValues.push(`${hours + addHour}:00`);
      addHour++;
    }
    return xValues;
  } else if (count === 5) {
    const options = {
      day: "numeric",
      month: "long",
    };

    for (let i = 0; i < 5; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() + i);

      const formattedDate = Intl.DateTimeFormat("pl", options).format(
        currentDate
      );
      xValues.push(formattedDate);
    }
    return xValues;
  } else throw new Error("Niepoprawne dane.");
};

const getYValues = async function (type) {
  const yValues = [];

  if (type === 12) {
    const data = await getJSON(forecast12hourURL);
    if (!data) throw new Error("Data is undefined.");
    for (const elem of data) {
      yValues.push(elem.Temperature.Value);
    }

    return yValues;
  } else if (type === 5) {
    const { DailyForecasts: data } = await getJSON(forecast5dayURL);

    if (!data) throw new Error("Data is undefined.");
    for (const elem of data) {
      yValues.push(elem.Temperature.Maximum.Value);
    }
    return yValues;
  } else throw new Error("Niepoprawne dane.");
};

weatherInfo5DayBtn.addEventListener("click", async () => {
  reloadChart();
  await setChart(5);
});

weatherInfo12HourBtn.addEventListener("click", async () => {
  reloadChart();
  await setChart(12);
});

// ----------------- INIT -------------------

const init = async function () {
  if (darkMode) {
    root.classList.add("dark-theme");
  }
  getGeolocation();
  // await getLocationKey("Tarnów");
  // await getYValues(5);
};

init();
