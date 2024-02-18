"use strict";

const getWeather = async function (city) {
  const locationRes = await fetch(
    `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&q=${city}&language=pl`
  );
  const locationData = await locationRes.json();
  const locationKey = locationData[0].Key;
  console.log(locationData);

  const forecastRes = await fetch(
    `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${locationKey}?apikey=dIOroisQxPFlFdSJAwgYmgD7GnIPaCn4&language=pl&metric=true`
  );
  const forecastData = await forecastRes.json();
  console.log(forecastData[0]);
};

// getWeather("Tarnów");

// ----------------- CLOCK -------------------

const clockContent = document.querySelector(".clock--content");

const updateClock = function () {
  const date = new Date();
  const hours = date.getHours() > 10 ? date.getHours() : "0" + date.getHours();
  const minutes =
    date.getMinutes() > 10 ? date.getMinutes() : "0" + date.getMinutes();
  const currentTime = `${hours}:${minutes}`;
  clockContent.textContent = currentTime;
};

setInterval(updateClock, 1000);
