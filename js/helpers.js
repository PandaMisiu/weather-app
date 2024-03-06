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
