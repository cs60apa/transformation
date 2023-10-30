import React from 'react';
import PrivateRoute from '../../components/common/PrivateRoute';
import {Switch, Route} from 'react-router-dom';
import PageError from "../../components/layout/PageError";
import Dashboard from '../../pages/authorized/Dashboard';
import AccessControl from "../../pages/authorized/AccessControl";
import PushNotification from "../../pages/authorized/PushNotification";
import App from "../../pages/authorized/App";
import Subscription from "../../pages/authorized/Subscription";
import Category from "../../pages/authorized/Category";
import Courses from "../../pages/authorized/Courses";
import ViewCourse from "../../pages/authorized/ViewCourse";
import Product from "../../pages/authorized/Product";
import Order from "../../pages/authorized/Order";
import Book from "../../pages/authorized/Book";
import Academia from "../../pages/authorized/Academia";
import School from "../../pages/authorized/School";
import Grade from "../../pages/authorized/Grade";

const Private = () => {
    return (
        <div>
            <Switch>
                <PrivateRoute exact path="/dashboard" component={Dashboard} />
                <PrivateRoute exact path="/subscription" component={Subscription} />
                <PrivateRoute exact path="/view-course/:course" component={ViewCourse} />
                <PrivateRoute exact path="/category" component={Category} />
                <PrivateRoute exact path="/academia" component={Academia} />
                <PrivateRoute exact path="/grade" component={Grade} />
                <PrivateRoute exact path="/product" component={Product} />
                <PrivateRoute exact path="/order" component={Order} />
                <PrivateRoute exact path="/book" component={Book} />
                <PrivateRoute exact path="/academia/:id" component={School} />
                <PrivateRoute exact path="/course" component={Courses} />
                <PrivateRoute exact path="/app" component={App} />
                <PrivateRoute exact path="/error" component={PageError} />
                <PrivateRoute exact path="/access-control" component={AccessControl} />
                <PrivateRoute exact path="/push-notification" component={PushNotification} />
                <Route component={PageError} />
            </Switch>
        </div>
    )
};

export default Private;
