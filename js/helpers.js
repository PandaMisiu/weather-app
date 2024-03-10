export const getJSON = async function (url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch.");
    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

const cityInfoName = document.querySelector(".city-info--name");
const cityInfoDate = document.querySelector(".city-info--date");

export const setCurrentCity = function (city) {
  cityInfoName.textContent = city;
};

export const getFullDate = function () {
  const now = new Date();
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  };

  cityInfoDate.textContent = Intl.DateTimeFormat("pl", options).format(now);
};

// ERROR HANDLING
const errorLabel = document.querySelector(".error--label");
const errorLabelButton = document.querySelector(".error--label-close-btn");
const errorLabelMessage = document.querySelector(".error--label-message");

const hideErrorLabel = function () {
  errorLabel.style.display = "none";
};

export const displayErrorLabel = function (message) {
  errorLabel.style.display = "flex";
  errorLabelMessage.textContent = message;

  errorLabelButton.addEventListener("click", hideErrorLabel);

  setTimeout(hideErrorLabel, 10000);
};

// CLOCK
const clockContent = document.querySelector(".clock--content");

export const updateClock = function () {
  const date = new Date();
  const hours = date.getHours() >= 10 ? date.getHours() : "0" + date.getHours();
  const minutes =
    date.getMinutes() >= 10 ? date.getMinutes() : "0" + date.getMinutes();
  const currentTime = `${hours}:${minutes}`;
  clockContent.textContent = currentTime;
};
