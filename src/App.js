import React, { Component } from 'react';
import { HashRouter as Router, Route, Switch} from 'react-router-dom';
import Login from './pages/auth/Login';
import jwt_decode from 'jwt-decode';
import setAuthToken from './utils/setAuthToken';
import { logoutUser } from './request';
import {SET_AUTH_USER} from './stores/auth';
// import Private from "./components/routes/Private";
import Dashboard from './pages/authorized/Dashboard';
import Logout from "./pages/auth/Logout";
import { Provider } from 'react-redux';
import 'bootstrap';

import store from './stores';

//Check for token
if(localStorage.jwtToken) {
    //Set auth token header auth
    setAuthToken(localStorage.jwtToken);

    //Decode token and get user info
    const decoded = jwt_decode(localStorage.jwtToken);
    //Set user and isAuthenticated
    store.dispatch(SET_AUTH_USER({user: decoded, isAuthenticated: true}));

    //Check for expired token
    const currentTime = Date.now() / 1000;
    if(decoded.exp < currentTime) {
        //Logout user
        store.dispatch(logoutUser());

        //Clear current profile
        window.location.href = "/";
    }
}

class App extends Component {
    render() {
        return (
            <Provider store={ store }>
                <Router>
                    <div className="App">
                        <Switch>
                            <Route exact path="/" component={Login} />
                            <Route exact path="/logout" component={Logout} />
                            {/* <Route component={Private} /> */}
                            <Route exact path="/dashboard" component={Dashboard} />
                            
                        </Switch>
                    </div>
                </Router>
            </Provider>
        );
    }
}

export default App;
