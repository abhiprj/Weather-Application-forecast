const apiKey = "31b1715eea27e8546c5192709d456eb7";
const mainEl = $("#main");

// onload
let lat = "18.519569";
let lon = "73.855347";
let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&exclude=hourly`;
let cityName = "Pune";
let firstLoad = true;

const searchBtn = $("#search-btn");
const searchDiv = $("#search");
const selectorDiv = $("#selector");
const prevSearchDiv = $("#previous-searches");

const kevlinToCelsius = (tempKel) => tempKel - 273.15;

const isInList = (currentId = "") => {
  return $(`[data-city-id="${currentId}"]`).length > 0;
};

const populatePreviouslySearched = () => {
  let prevCitiesArr = getCitiesFromLocalStorage();
  prevCitiesArr.forEach((city) => {
    addToPreviouslySearched(city);
  });
};

const clearPreviouslySearched = () => {
  window.localStorage.setItem("prevCities", "[]");
  $("#previous-searches").empty();
};

const addToPreviouslySearched = (cityObj) => {
  const { cityLon, cityLat, cityName, cityCountry, cityId } = cityObj;

  if (isInList(cityId)) {
    $(`[data-city-id="${cityId}"]`).remove();
  }

  prevSearchDiv.prepend(
    $(`<span>${cityName}, ${cityCountry}</span>`)
      .attr("data-city-lon", cityLon)
      .attr("data-city-lat", cityLat)
      .attr("data-city-name", cityName)
      .attr("data-city-country", cityCountry)
      .attr("data-city-id", cityId)
      .addClass("prev-searched")
      .on("click", loadNewData)
  );
};

const addToLocalStorage = (cityObj) => {
  let prevCitiesArr = getCitiesFromLocalStorage();
  prevCitiesArr.push(cityObj);
  window.localStorage.setItem("prevCities", JSON.stringify(prevCitiesArr));
};

const getCitiesFromLocalStorage = () => {
  return JSON.parse(window.localStorage.getItem("prevCities")) || [];
};

const showFoundCities = () => {
  selectorDiv.removeClass("selector-hidden").addClass("selector-visible");
  searchDiv.hide();
};

const clearAndHideFoundCities = () => {
  selectorDiv
    .empty()
    .removeClass("selector-visible")
    .addClass("selector-hidden");
  searchDiv.show();
  $("#search-btn").siblings("input").val("");
};

const getEndPoint = (cityLat, cityLon) => {
  return `https://api.openweathermap.org/data/2.5/onecall?lat=${cityLat}&lon=${cityLon}&appid=${apiKey}&exclude=hourly`;
};

const loadNewData = (event) => {
  const target = event.target || event; // Handle both event and direct call
  const curCityLon = $(target).data("city-lon");
  const curCityLat = $(target).data("city-lat");
  const curCityName = $(target).data("city-name");
  cityName = curCityName;
  const curCityCountry = $(target).data("city-country");
  const curCityId = $(target).data("city-id");

  getDataThenPopulatePage(getEndPoint(curCityLat, curCityLon));

  clearAndHideFoundCities();
  const currentCityObj = {
    cityLat: curCityLat,
    cityLon: curCityLon,
    cityName: curCityName,
    cityCountry: curCityCountry,
    cityId: curCityId,
  };

  addToLocalStorage(currentCityObj);
  addToPreviouslySearched(currentCityObj);
};

const searchCity = () => {
  selectorDiv.empty();
  const cityNameInput = $("#search-btn").siblings("input").val().trim();

  // Check if input is empty
  if (cityNameInput === "") {
    alert("Please enter a city name.");
    return; // Exit the function if input is empty
  }

  const matchingCities = cities.filter(
    (city) => city.name.toLowerCase() === cityNameInput.toLowerCase()
  );

  if (matchingCities.length > 0) {
    const selectedCity = matchingCities[0];

    loadNewData({
      target: $(`<span></span>`).data({
        "city-lon": selectedCity.coord.lon,
        "city-lat": selectedCity.coord.lat,
        "city-name": selectedCity.name,
        "city-country": selectedCity.country,
        "city-id": selectedCity.id,
      }),
    });
  } else {
    showFoundCities();
    selectorDiv.append($("<p>City not found, please search again</p>"));
    selectorDiv.on("click", clearAndHideFoundCities);
  }
};

const getDataThenPopulatePage = (endpoint) => {
  $.ajax({
    url: endpoint,
    method: "GET",
  }).then((response) => {
    if (firstLoad) {
      populatePreviouslySearched();
      firstLoad = false;
    }
    updateWeather(response);
  });
};

const getUVIndexSeverity = (uvValue) => {
  if (uvValue <= 2) {
    return "low-uv";
  } else if (uvValue <= 5) {
    return "moderate-uv";
  } else if (uvValue <= 7) {
    return "high-uv";
  } else if (uvValue <= 10) {
    return "very-high-uv";
  } else {
    return "severe-uv";
  }
};

const updateWeather = (weatherData) => {
  const todaysCard = $("#main-card");
  const fiveDay = $("#container-daily-cards");
  const currentDate = new Date(weatherData.current.dt * 1000);
  const todayImg = $("#today-img");

  $("#city-name").text(cityName);
  $("#todays-date").text(currentDate.toDateString());
  const todayMinTemp = kevlinToCelsius(weatherData.daily[0].temp.min).toFixed(
    1
  );
  const todayMaxTemp = kevlinToCelsius(weatherData.daily[0].temp.max).toFixed(
    1
  );
  $("#today-min").text(`Min: ${todayMinTemp}°C`);
  $("#today-max").text(`Max: ${todayMaxTemp}°C`);

  $("#today-wind").text(`Wind speed: ${weatherData.daily[0].wind_speed} m/s`);
  $("#today-humidity").text(`Humidity: ${weatherData.daily[0].humidity}%`);

  $("#today-uv")
    .text(`UV: ${weatherData.daily[0].uvi}`)
    .removeClass()
    .addClass(getUVIndexSeverity(weatherData.daily[0].uvi));

  const todayIcon = weatherData.daily[0].weather[0].icon;
  todayImg.attr("src", `http://openweathermap.org/img/wn/${todayIcon}@2x.png`);

  fiveDay.children().each((index, child) => {
    const eachDayData = weatherData.daily[index + 1];
    const eachDayDate = new Date(eachDayData.dt * 1000);
    const eachDayIcon = eachDayData.weather[0].icon;

    $(child).find(".day").text(eachDayDate.toDateString());
    $(child)
      .find(".weather-img")
      .attr("src", `http://openweathermap.org/img/wn/${eachDayIcon}@2x.png`);

    $(child)
      .find(".max")
      .text(`Max: ${kevlinToCelsius(eachDayData.temp.max).toFixed(1)}°C`);
    $(child)
      .find(".min")
      .text(`Min: ${kevlinToCelsius(eachDayData.temp.min).toFixed(1)}°C`);

    $(child).find(".wind").text(`Wind: ${eachDayData.wind_speed} m/s`);
    $(child).find(".humidity").text(`Humidity: ${eachDayData.humidity}%`);
  });
};

$(document).ready(() => {
  getDataThenPopulatePage(url);

  searchBtn.on("click", (event) => {
    event.preventDefault();
    searchCity();
  });

  const clearHistoryBtn = $("#clear-history");
  clearHistoryBtn.on("click", clearPreviouslySearched);
});
