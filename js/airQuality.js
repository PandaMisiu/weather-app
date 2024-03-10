import { getJSON } from "./helpers.js";
import { API_KEY_POLLUTION } from "./config.js";
import { airQuality } from "./model.js";

const airQualityPM2_5 = document.querySelector(".air-quality-pm25-value");
const airQualityPM10 = document.querySelector(".air-quality-pm10-value");
const airQualityCO = document.querySelector(".air-quality-co-value");
const airQualityNO = document.querySelector(".air-quality-no-value");
const airQualityNO2 = document.querySelector(".air-quality-no2-value");
const airQualityO3 = document.querySelector(".air-quality-o3-value");
const airQualitySO2 = document.querySelector(".air-quality-so2-value");
const airQualityNH3 = document.querySelector(".air-quality-nh3-value");

const getPositionFromCity = async function (city, limit) {
  try {
    const [{ lat, lon }] = await getJSON(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=${limit}&appid=${API_KEY_POLLUTION}`
    );
    return { lat, lon };
  } catch (err) {
    displayErrorLabel(err.message);
  }
};

const getAirQuality = async function (city) {
  try {
    const { lat, lon } = await getPositionFromCity(city, 1);
    const { list: data } = await getJSON(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY_POLLUTION}`
    );
    airQuality.components = data[0].components;
    airQuality.aqi = data[0].main.aqi;
  } catch (err) {
    displayErrorLabel(err.message);
  }
};

export const setAirQuality = async function (city) {
  try {
    await getAirQuality(city);
    airQualityPM2_5.textContent = airQuality.components.pm2_5;
    airQualityPM10.textContent = airQuality.components.pm10;
    airQualityCO.textContent = airQuality.components.co;
    airQualityNO.textContent = airQuality.components.no;
    airQualityNO2.textContent = airQuality.components.no2;
    airQualityO3.textContent = airQuality.components.o3;
    airQualitySO2.textContent = airQuality.components.so2;
    airQualityNH3.textContent = airQuality.components.nh3;

    airQualityPM2_5.style.color = `var(--air-quality-${airQuality.aqi})`;
  } catch (err) {
    displayErrorLabel(err.message);
  }
};
