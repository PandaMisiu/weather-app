"use strict";

// TODO:
// - graf, dodać temperature itp
// - weather info 12 hour i 5 dni
// - przyciski obok pogody do zmiany grafu na 12 hour i 5 dni
// - dodać żeby w tym boxie przy hoverze była tylko temperatura

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

// takes data.WeatherIcon as argument
const getWeatherState = function (icon) {
  if (icon >= 1 && icon <= 2) return "sunny";
  else if (icon >= 3 && icon <= 5) return "partly_cloudy_day";
  else if (icon >= 6 && icon <= 8) return "cloud";
  else if (icon === 11) return "foggy";
  else if ((icon >= 12 && icon <= 14) || (icon >= 18 && icon <= 21))
    return "rainy";
  else if (icon >= 15 && icon <= 17) return "thunderstorm";
  else if (icon >= 22 && icon <= 24) return "cloudy_snowing";
  else if (icon === 25 || icon === 29) return "weather_mix";
  else if (icon === 26) return "weather_hail";
  else if (icon === 30) return "heat";
  else if (icon === 31) return "severe_cold";
  else if (icon === 32) return "air";
  else if (icon === 33) return "clear_night";
  else return "partly_cloudy_night";
};

const setCurrentWeatherState = function (data) {
  weatherInfoImg.textContent = getWeatherState(data.WeatherIcon);
};

let defaultCity = "Warszawa"; // global default city, when geolacation fails
let locationKey = 0; // global location key, to only run getLocationKey function once

const setWeatherInfo = async function (city) {
  try {
    getFullDate();
    await getLocationKey(city);
    if (locationKey === undefined) throw new Error("Invalid Location Key");
    setCurrentCity(city);
    const currentWeather = await getCurrentWeather(locationKey);
    // console.log(currentWeather);
    setCurrentWeather(currentWeather);
    // await get5DaysForecast();
  } catch (err) {
    console.log(err.message);
  }
};

const getLocationKey = async function (city) {
  try {
    const locationRes = await fetch(
      `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&q=${city}&language=pl`
    );
    if (!locationRes.ok) throw new Error("Failed to fetch.");
    console.log(locationRes);
    const locationData = await locationRes.json();
    locationKey = locationData[0].Key;
  } catch (err) {
    displayErrorLabel("Nie udało się znaleźć miejscowości.");
  }
};

const getCurrentWeather = async function (locationKey) {
  try {
    // fetching for current forecast
    const forecastRes = await fetch(
      `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&language=pl&details=true`
    );
    if (!forecastRes.ok) throw new Error("Failed to fetch.");
    const forecastData = await forecastRes.json();
    return forecastData[0];
  } catch (err) {
    displayErrorLabel("Nie udało się uzyskać danych o pogodzie.");
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

const get12HForecast = async function () {
  try {
    //const locationKey = await getLocationKey(city);
    const forecastRes = await fetch(
      `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${locationKey}?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&language=pl&metric=true`
    );
    if (!forecastRes.ok) throw new Error("Failed to fetch.");
    const forecastData = await forecastRes.json();
    return forecastData;
  } catch (err) {
    console.error(err.message);
  }
};

const get5DaysForecast = async function () {
  try {
    //const locationKey = await getLocationKey(city);
    const forecastRes = await fetch(
      `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&language=pl&metric=true`
    );
    if (!forecastRes.ok) throw new Error("Failed to fetch.");
    const forecastData = await forecastRes.json();
    console.log(forecastData.DailyForecasts);
    return forecastData.DailyForecasts;
  } catch (err) {
    console.error(err.message);
  }
};

// ----------------- GEOLOCATION -----------------

const geolocationPositive = async function (position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  // 1. setWeatherToCurrentLocation
  const city = await reverseGeocoding(latitude, longitude);
  await setWeatherInfo(city);
  await chartInit();
};

const geolocationNegative = async function () {
  displayErrorLabel(
    "Nie udało się uzyskać Twojej lokalizacji. Zmień ustawienia w przeglądarce."
  );
  // set weather to default city
  await setWeatherInfo(defaultCity);
  await chartInit();
};

const getGeolocation = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      geolocationPositive,
      geolocationNegative
    );
  }
};

const reverseGeocoding = async function (lat, long) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`
    );
    const data = await res.json();
    const city = data.address?.city;
    return city;
  } catch (err) {
    console.log(err.message);
    displayErrorLabel("Nie udało się odnaleźć twojej lokalizacji.");
  }
};

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
Chart.defaults.global.defaultFontSize = 16;
Chart.defaults.global.defaultFontColor =
  getComputedStyle(root).getPropertyValue("--text-color");

const set12HourChart = function () {};

const chartInit = async function () {
  const xValues = getXValues(12);
  const yValues = await getYValues(12);
  // const yValues = [5, 4, 3, 2, 1, 1, 1, 1, 3, 6, 9, 12];
  const ymin = Math.min(...yValues);
  const ymax = Math.max(...yValues);
  const barColor = getComputedStyle(root).getPropertyValue("--chart-bar-color");

  const weatherChart = new Chart(document.getElementById("weatherChart"), {
    type: "line",
    data: {
      labels: xValues,
      datasets: [
        {
          backgroundColor: barColor,
          data: yValues,
          fill: false,
          borderWidth: 3,
          borderColor: barColor,
        },
      ],
    },
    options: {
      legend: false,
      scales: {
        yAxes: [
          {
            ticks: {
              min: ymin - 3,
              max: ymax + 3,
              stepSize: (ymax + ymin) / 12,
            },
          },
        ],
      },
    },
  });
};

const getXValues = function (count) {
  const xValues = [];
  const date = new Date();
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
};

const getYValues = async function (type) {
  const data = type === 12 ? await get12HForecast() : await get5DaysForecast();
  const yValues = [];
  for (const elem of data) {
    yValues.push(elem.Temperature.Value);
  }
  return yValues;
};

// ----------------- INIT -------------------

const init = function () {
  if (darkMode) {
    root.classList.add("dark-theme");
  }
  getGeolocation();
};

init();
