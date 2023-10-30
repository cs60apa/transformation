import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';
import {SIGNIN_URL} from '../api';
import jwt_decode from 'jwt-decode';
import {SET_AUTH_USER, UNSET_USER} from '../stores/auth';
import errorHandler from "../utils/errorHandler";

//Login - Auth Token
export const loginUser = (userData) => {
    return function(dispatch) {
        return axios.post(SIGNIN_URL, userData).then((response) => {
            //Save to localStorage
            const { token } = response.data;

            //Set token to localStorage
            localStorage.setItem('jwtToken', token);

            //Set token to Auth header
            setAuthToken(token);

            //Decode token to get user data
            const decoded = jwt_decode(token);

            //Set current user
            dispatch(SET_AUTH_USER({user: decoded, isAuthenticated: true}));
        }).catch((error) => {
            errorHandler(error, "top-center");
        });
    }
};

export const logoutUser = () => {
    return function(dispatch) {
        //Remove toke from localStorage
        localStorage.clear();

        //Remove auth header for future requests
        setAuthToken(false);

        //Set current user to {} which will set isAuthenticated to false
        dispatch(UNSET_USER());
    }
};
