import axios from "axios";
import {GET_USER_REPORT_URL, GET_SUBSCRIPTION_REPORT_URL, GET_ORDER_REPORT_URL} from "../api";
import errorHandler from "../utils/errorHandler";

export const getUserReport = () => {
    return axios.get(GET_USER_REPORT_URL).then((response) => {
        return {
            payload: response.data,
            error: false
        };
    }).catch((error) => {
        return {
            payload: errorHandler(error, "top-center"),
            error: true
        };
    });
};

export const getSubscriptionReport = () => {
    return axios.get(GET_SUBSCRIPTION_REPORT_URL).then((response) => {
        return {
            payload: response.data,
            error: false
        };
    }).catch((error) => {
        return {
            payload: errorHandler(error, "top-center"),
            error: true
        };
    });
}

export const getOrderReport = () => {
    return axios.get(GET_ORDER_REPORT_URL).then((response) => {
        return {
            payload: response.data,
            error: false
        };
    }).catch((error) => {
        return {
            payload: errorHandler(error, "top-center"),
            error: true
        };
    });
}