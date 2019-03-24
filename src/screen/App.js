import React, { Component } from "react";

const APPKEY = "d12077a5c8525e95d04cfc660ccc801d";
const CURR_WEATHER_API =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const FUTURE_WEATHER_API =
  "https://api.openweathermap.org/data/2.5/forecast?units=metric&";

const getGeoLocation = () => {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          const coordinates = {
            lon: position.coords.longitude,
            lat: position.coords.latitude
          };
          resolve(coordinates);
        },
        function(PositionError) {
          reject(PositionError.message);
        }
      );
    } else {
      reject("Geolocation not supported");
    }
  });
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayMainContent: true,
      coordinates: null,
      currWeather: null,
      type: null,
      time: null,
      today_low: null,
      tomorrow_low: null,
      today_high: null,
      tomorrow_high: null,
      futureWeather: null,
      futureTemp: null
    };
  }

  componentDidMount() {
    this.getUserCoordinates().then(success =>
      this.getCurrentForecast().then(success => {
        this.getTimeOfTheDay();
        this.getWeatherType();
        this.getFutureForecast().then(success => {
          this.setHighLow();
          this.formatFutureData();
        });
      })
    );
  }

  getUserCoordinates = () => {
    return new Promise((resolve, reject) => {
      getGeoLocation()
        .then(coordinates => {
          this.setState(
            {
              coordinates: coordinates
            },
            () => {
              resolve(true);
            }
          );
        })
        .catch(err => {
          alert(err);
          reject(err);
        });
    });
  };

  getCurrentForecast = () => {
    return new Promise((resolve, reject) => {
      fetch(
        CURR_WEATHER_API +
          "lat=" +
          this.state.coordinates.lat +
          "&lon=" +
          this.state.coordinates.lon +
          "&APPID=" +
          APPKEY
      )
        .then(resp => resp.json())
        .then(respJson => {
          this.setState(
            {
              currWeather: respJson
            },
            () => resolve(true)
          );
        })
        .catch(err => {
          console.log("CURR WEATHER API ERROR", err);
          reject(err);
        });
    });
  };

  getFutureForecast = () => {
    return new Promise((resolve, reject) => {
      fetch(
        FUTURE_WEATHER_API +
          "lat=" +
          this.state.coordinates.lat +
          "&lon=" +
          this.state.coordinates.lon +
          "&APPID=" +
          APPKEY
      )
        .then(resp => resp.json())
        .then(respJson => {
          this.setState(
            {
              futureWeather: respJson
            },
            () => resolve(true)
          );
        })
        .catch(err => {
          console.log("FUTURE WEATHER API ERROR", err);
          reject(err);
        });
    });
  };

  getWeatherType = () => {
    const weather_id = String(this.state.currWeather.weather[0].id);
    const group = weather_id[0];

    let type = "normal";

    switch (group) {
      case 7:
      case 8:
        type = "cloudy";
        break;
      case 3:
      case 5:
        type = "rainy";
        break;
      case 2:
        type = "storm";
        break;
      default:
        type = "normal";
    }

    if (weather_id === "800") type = "normal";

    this.setState({
      type: type
    });
  };

  getTimeOfTheDay = () => {
    const this_hour = new Date().getHours();
    let time = "day";

    if (this_hour >= 6 && this_hour < 18) time = "day";
    else time = "night";

    this.setState({
      time: time
    });
  };

  setHighLow = () => {
    const data = this.state.futureWeather.list;

    let today_low = 999;
    let today_high = -999;
    let tomorrow_low = 999;
    let tomorrow_high = -999;

    for (let i = 0; i <= 7; i++) {
      if (data[i].main.temp_min < today_low) today_low = data[i].main.temp_min;
      if (data[i].main.temp_max > today_high)
        today_high = data[i].main.temp_max;
    }

    for (let i = 7; i <= 15; i++) {
      if (data[i].main.temp_min < tomorrow_low)
        tomorrow_low = data[i].main.temp_min;
      if (data[i].main.temp_max > tomorrow_high)
        tomorrow_high = data[i].main.temp_max;
    }

    this.setState({
      today_high: today_high,
      tomorrow_high: tomorrow_high,
      today_low: today_low,
      tomorrow_low: tomorrow_low
    });
  };

  toggleContent = () => {
    this.setState({
      displayMainContent: !this.state.displayMainContent
    });
  };

  formatFutureData = () => {
    const future_data_list = this.state.futureWeather.list;

    let future_data = [];

    for (let i = 0; i < 40; i += 8) {
      let today_data = [];
      console.log("DAY", i);
      for (let j = i; j < i + 8; j++) {
        const temp = future_data_list[j].main.temp;
        /*         console.log("Weather for hour", j, "is", temp);
         */ today_data.push(temp);
      }
      console.log(today_data);
      future_data.push(today_data);
    }

    this.setState({ futureTemp: future_data });
  };

  render() {
    return (
      <div className="App" style={styles.mainContainer}>
        <div className="iphone-screen" style={styles.iphoneContainer}>
          {this.state.displayMainContent
            ? this._renderMainContent()
            : this._renderFutureWeatherContent()}

          <div className="additionalInfo">
            {!this.state.currWeather && this._renderActiityIndicator()}
            <div id="sunrise" className="additional-label">
              <span>&#127749; sunrise</span>{" "}
              <span>
                {this.state.currWeather
                  ? new Date(
                      this.state.currWeather.sys.sunrise * 1000
                    ).toLocaleString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true
                    })
                  : "5.35am"}
              </span>
            </div>
            <div id="sunset" className="additional-label">
              <span>&#127751; sunset</span>{" "}
              <span>
                {this.state.currWeather
                  ? new Date(
                      this.state.currWeather.sys.sunset * 1000
                    ).toLocaleString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true
                    })
                  : "6.51pm"}
              </span>
            </div>
            <div id="today-range" className="additional-label">
              <span>🌡 today</span>{" "}
              <span>
                {this.state.today_low
                  ? this.state.today_low +
                    "°c" +
                    " to " +
                    (this.state.today_high + "°c")
                  : "18° - 35°"}
              </span>
            </div>
            <div id="tomorrow-range" className="additional-label">
              <span>🌡 tomorrow</span>{" "}
              <span>
                {this.state.tomorrow_high
                  ? this.state.tomorrow_low +
                    "°c" +
                    " to " +
                    (this.state.tomorrow_high + "°c")
                  : "18° - 35°"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  _renderActiityIndicator = () => {
    return (
      <div className="activityIndicator">
        <div className="aiGraphic">
          <img
            src={require("../assets/gifs/loader.gif")}
            height={50}
            width={50}
            alt="Activity Indicator"
          />
        </div>
        <span className="aiText">Please wait...</span>
      </div>
    );
  };

  _renderMainContent = () => {
    return (
      <div className="mainInfo">
        <div className="mainContent">
          <img
            src={
              this.state.type && this.state.time
                ? require("../assets/images/weatherConditions/" +
                    this.state.type +
                    "-" +
                    this.state.time +
                    ".svg")
                : require("../assets/images/weatherConditions/normal-day.svg")
            }
            height="75"
            width="75"
            alt="Current Weather"
          />
          <span id="cityName">
            {this.state.currWeather ? this.state.currWeather.name : "Delhi"}
          </span>
          <span id="country">
            {this.state.currWeather
              ? this.state.currWeather.sys.country
              : "India"}
          </span>
          <span id="temperature">
            {this.state.currWeather ? this.state.currWeather.main.temp : "35"}
            °c
          </span>
          <div id="humidity">
            <span>
              {this.state.currWeather
                ? this.state.currWeather.main.humidity
                : "35"}
              %
            </span>
            <img
              src={require("../assets/images/weatherIcons/humidity.svg")}
              height={25}
              width={25}
              alt="Current Humidity"
            />
          </div>
          <div id="wind-speed">
            <span>
              {this.state.currWeather
                ? (this.state.currWeather.wind.speed * 3.6).toFixed(2) //conversion of m/s to km/h
                : "35"}
              km/h
            </span>
            <img
              src={require("../assets/images/weatherIcons/breeze.svg")}
              height={25}
              width={25}
              alt="Current Wind Speed"
            />
          </div>
        </div>
        <div className="menuBtn" onClick={this.toggleContent}>
          <span className="more-info">&gt;</span>
        </div>
      </div>
    );
  };

  _renderFutureWeatherContent = () => {
    return (
      <div className="mainInfo">
        <div className="menuBtn" onClick={this.toggleContent}>
          <span className="more-info more-info-reverse">&lt;</span>
        </div>
        <div className="mainContent">
          <div className="future-list">
            {this.state.futureTemp && this._renderFutureList()}
          </div>
        </div>
      </div>
    );
  };

  _renderFutureList = () => {
    return this.state.futureTemp.map((day_temp, index) => {
      let day_high = Math.max(...day_temp);
      let day_low = Math.min(...day_temp);

      return (
        <div className="day-record" key={index}>
          <span className="day-date">
            {new Date(
              this.state.futureWeather.list[index * 8].dt * 1000
            ).toLocaleString("en-GB", {
              weekday: "short",
              year: "numeric",
              month: "2-digit",
              day: "numeric"
            })}
          </span>
          <div className="day-min day-temp">
            <span className="down-emoji">⬇</span>
            <span className="low-temp temp">{day_low}°c</span>
          </div>
          <div className="day-min day-temp">
            <span className="up-emoji">⬆</span>
            <span className="high-temp temp">{day_high}°c</span>
          </div>
        </div>
      );
    });
  };
}

const styles = {
  mainContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  iphoneContainer: {
    flex: 1,
    width: 375,
    height: 667
  }
};

export default App;
