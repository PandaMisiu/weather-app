import Chart from "chart.js/auto";
import "core-js/stable";
import "regenerator-runtime/runtime";
import {
  API_KEY_POLLUTION,
  API_KEY_WEATHER,
  CURRENT_WEATHER_URL,
  DEFAULT_CITY,
  DETAILS,
  FORECAST_12H_URL,
  FORECAST_5D_URL,
  LOCATION_KEY_URL,
  METRIC,
} from "./config.js";
import { forecast12H, forecast5D, airQuality } from "./model.js";
import {
  getJSON,
  setCurrentCity,
  getFullDate,
  displayErrorLabel,
  updateClock,
} from "./helpers.js";
import { setAirQuality } from "./airQuality.js";

// GEOLOCATION
const geolocationBtn = document.querySelector(".geolocation--btn");

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

// DARK MODE
const darkModeBtn = document.querySelector(".change-mode--btn");
const root = document.documentElement;
const darkMode = localStorage.getItem("dark-mode");
const darkModeBtnContent = document.querySelector(".change-mode--btn-content");

// HAMBURGER MENU
const hamburgerMenuBtn = document.querySelector(".hamburger-menu");
const btnsContainer = document.querySelector(".btns--container");
const btnLabels = document.querySelectorAll(".btn--label");

// ----------------- CURRENT WEATHER INFO -----------------

let locationKey = 0; // global location key, to only run getLocationKey function once

const setWeatherInfo = async function (city) {
  try {
    getFullDate();
    await getLocationKey(city);
    if (!locationKey) throw new Error("Invalid Location Key");
    setCurrentCity(city);
    const [currentWeather] = await getJSON(
      CURRENT_WEATHER_URL + locationKey + API_KEY_WEATHER + DETAILS
    );
    setCurrentWeather(currentWeather);
    await getChartForecast();
    setChart(12);
    await setAirQuality(city);
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

// finds the location key of the city and sets the urls for other APIs
const getLocationKey = async function (city) {
  try {
    const res = await fetch(`${LOCATION_KEY_URL}${city}`);
    if (!res.ok) throw new Error("Failed to fetch.");
    const data = await res.json();
    locationKey = data[0].Key;
  } catch (err) {
    displayErrorLabel("Nie udało się znaleźć miejscowości.");
  }
};

const setCurrentWeather = function (data) {
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

// ----------------- GEOLOCATION -----------------

const geolocationPositive = async function (position) {
  try {
    const { latitude, longitude } = position.coords;
    const data = await getJSON(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
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
  await setWeatherInfo(DEFAULT_CITY);
};

export const getGeolocation = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      geolocationPositive,
      geolocationNegative
    );
  }
};

geolocationBtn.addEventListener("click", getGeolocation);

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

// ----------------- DARK MODE -------------------

darkModeBtn.addEventListener("click", () => {
  root.classList.toggle("dark-theme");

  if (root.classList.contains("dark-theme")) {
    localStorage.setItem("dark-mode", true);
    console.log(darkModeBtnContent);
    darkModeBtnContent.textContent = "light_mode";
  } else {
    localStorage.removeItem("dark-mode");
    darkModeBtnContent.textContent = "dark_mode";
  }
});

// ----------------- CHART ---------------------

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

const getChartForecast = async function () {
  await getYValues(12);
  await getYValues(5);
};

let currentChartType = 12;

const setChart = function (type) {
  const xValues = getXValues(type);
  const temperatureValues =
    type === 12 ? forecast12H.temperatures : forecast5D.temperatures;
  const rainValues = type === 12 ? forecast12H.rain : forecast5D.rain;
  const tempMax = Math.max(...temperatureValues);
  const tempMin = Math.min(...temperatureValues);
  const rainMax = Math.max(...rainValues);

  const color = getComputedStyle(root).getPropertyValue(
    "--chart-default-color"
  );
  const colorSecondary = getComputedStyle(root).getPropertyValue(
    "--chart-secondary-color"
  );

  const data = {
    labels: xValues,
    datasets: [
      {
        type: "line",
        backgroundColor: color,
        data: temperatureValues,
        fill: false,
        borderWidth: 3,
        borderColor: color,
        yAxisID: "temperature",
      },
      {
        type: "bar",
        data: rainValues,
        backgroundColor: colorSecondary,
        yAxisID: "rain",
      },
    ],
  };
  const config = {
    data,
    options: {
      responsive: false,
      maintainAspectRatio: false,
      legend: false,
      scales: {
        temperature: {
          axis: "y",
          min: Math.floor(tempMin - tempMin / 10),
          max: Math.ceil(tempMax + tempMax / 10),
          ticks: {
            stepSize: 1,
            color: colorSecondary,
            font: {
              size: 15,
              family: "Montserrat, Arial",
              weight: 500,
            },
          },
        },

        rain: {
          axis: "y",
          max: rainMax + rainMax / 10,
          display: false,
        },
        x: {
          ticks: {
            color: colorSecondary,
            font: {
              size: 15,
              family: "Montserrat, Arial",
              weight: 500,
            },
          },
        },
      },
      elements: {
        point: {
          hitRadius: 30,
          pointHoverRadius: 5,
          radius: 3,
        },
      },
      plugins: {
        tooltip: {
          yAlign: "bottom",
          backgroundColor: color,
          bodyFont: {
            weight: 500,
            size: 16,
            family: "Montserrat, Arial",
          },
          displayColors: false,
          padding: 10,
          callbacks: {
            title: () => "",
            label: (elem) => {
              return elem.datasetIndex === 0
                ? `${elem.raw}°C`
                : `${elem.raw} mm`;
            },
          },
        },
        legend: false,
      },
    },
  };

  reloadChart();
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
  try {
    const temperatures = [];
    const rain = [];

    if (type === 12) {
      const data = await getJSON(
        FORECAST_12H_URL + locationKey + API_KEY_WEATHER + METRIC + DETAILS
      );

      if (!data) throw new Error("Data is undefined.");
      for (const elem of data) {
        temperatures.push(elem.Temperature.Value);
        rain.push(elem.Rain.Value);
      }
      forecast12H.temperatures = temperatures;
      forecast12H.rain = rain;
    } else if (type === 5) {
      const { DailyForecasts: data } = await getJSON(
        FORECAST_5D_URL + locationKey + API_KEY_WEATHER + METRIC + DETAILS
      );
      if (!data) throw new Error("Data is undefined.");
      for (const elem of data) {
        temperatures.push(elem.Temperature.Maximum.Value);
        rain.push(elem.Day.Rain.Value);
      }
      forecast5D.temperatures = temperatures;
      forecast5D.rain = rain;
    } else throw new Error("Niepoprawne dane.");
  } catch (err) {
    displayErrorLabel(err.message);
  }
};

weatherInfo5DayBtn.addEventListener("click", () => {
  setChart(5);
  currentChartType = 5;
});

weatherInfo12HourBtn.addEventListener("click", () => {
  setChart(12);
  currentChartType = 12;
});

// ----------------- HAMBURGER MENU -------------------

function getWidth() {
  return document.body.offsetWidth;
}

const menuExpand = function () {
  const expanded =
    hamburgerMenuBtn.getAttribute("aria-expanded") === "true" ? true : false;
  if (!expanded) {
    btnsContainer.style.transform = "translate(0%, 80%)";
    hamburgerMenuBtn.setAttribute("aria-expanded", true);
  } else {
    btnsContainer.style.transform = "translate(200%, 80%)";
    hamburgerMenuBtn.setAttribute("aria-expanded", false);
  }
};

hamburgerMenuBtn.addEventListener("click", menuExpand);

window.onresize = resize;

function resize() {
  const pageWidth = getWidth();
  if (pageWidth <= 500) hamburgerON();
  else hamburgerOFF();
  setChart(currentChartType);
}

const hamburgerOFF = function () {
  hamburgerMenuBtn.style.display = "none";
  hamburgerMenuBtn.setAttribute("aria-expanded", false);
  btnsContainer.removeAttribute("style");
  btnsContainer.classList.remove("hamburger-on");
};

const hamburgerON = function () {
  hamburgerMenuBtn.style.display = "flex";
  btnsContainer.classList.add("hamburger-on");
  setTimeout(() => {
    btnsContainer.style.transition = "0.25s";
  }, 10);
};

const hamburgerMenuInit = function () {
  const pageWidth = getWidth();
  if (pageWidth > 500) hamburgerOFF();
  else hamburgerON();
};

// ----------------- INIT -------------------

const init = async function () {
  if (darkMode) {
    root.classList.add("dark-theme");
    darkModeBtnContent.textContent = "light_mode";
  }
  getGeolocation();
  hamburgerMenuInit();
};
setInterval(updateClock, 1000);
init();
