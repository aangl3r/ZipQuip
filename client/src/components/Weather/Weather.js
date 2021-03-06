import React, { Component } from "react";
import "./Weather.css"
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import axios from "axios";

const styles = theme => ({
    bullet: {
        display: "inline-block",
        margin: "0 2px",
        transform: "scale(0.8)",
    },
    title: {
        fontSize: 17,
    },
    pos: {
        marginBottom: 12,
    },
    weatherBox: {
        border: 54
    }
});

class Weather extends Component {
    state = {
        temp: "",
        humidity: "",
        wind: "",
        icon: "",
        location: ""
    };

    componentDidMount() {
        fetch("/api/session", {
            method: "Get", // *GET, POST, PUT, DELETE, etc.
            mode: "cors", // no-cors, cors, *same-origin
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            credentials: "include", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json",
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "client", // no-referrer, *client
        })
            .then(res => res.json())
            .then(
                result => {
                    const { loc } = result.data;
                    console.log(result);
                    this.setState({
                        location: loc,
                    });
                    this.getWeather();
                },
                error => {
                    console.log(error);
                }
            );
        
    }

    getWeather = location => {
        axios
            .get(
                `https://api.openweathermap.org/data/2.5/weather?zip=${this.state.location},us&APPID=a0e8c6ce4e039dfb38fd4b809082c416`
            )
            .then(response => {
                console.log(response);
                const temp = this.tempConvert(response.data.main.temp);
                const humidity = response.data.main.humidity;
                const icon = response.data.weather[0].icon;
                const wind = this.speedConvert(response.data.wind.speed);
                console.log(icon);
                this.setState({
                    temp: temp,
                    humidity: humidity,
                    wind: wind,
                    icon: `https://openweathermap.org/img/w/${icon}.png`,
                    //changing from http to https per console in heroku
                });
            })
            .catch(error => {
                console.log(error);
            });
    };

    tempConvert = temp => {
        const convertedTemp = (temp - 273.15) * (9 / 5) + 32;
        return Number.parseFloat(convertedTemp).toFixed(2);
    };

    speedConvert = speed => {
        const convertedSpeed = speed * 2.237;
        return Number.parseFloat(convertedSpeed).toFixed(1);
    };

    render() {
        return (
            <div className={"weatherBox"}>
                <Typography color="textSecondary" variant="h5" gutterBottom>
                    Weather in {this.state.location}
                </Typography>
                <img src={this.state.icon} alt="Sorry." />
                <Typography color="textSecondary" variant="h4" gutterBottom>
                    <b>Temperature:</b> {this.state.temp + "°F"}
                </Typography>
                <Typography color="textSecondary" variant="h4" gutterBottom>
                    <b>Humidity:</b> {this.state.humidity + "%"}
                </Typography>
                <Typography color="textSecondary" variant="h4" gutterBottom>
                    <b>Wind:</b> {this.state.wind + " mph"}
                </Typography>
            </div>
        );
    }
}

Weather.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Weather);
