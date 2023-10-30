import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import {useSelector} from 'react-redux';
import Header from "../layout/Header";
import Search from "../../pages/authorized/Search";

const PrivateRoute = ({component: Component, ...rest}) => {
    const auth = useSelector((state) => state.auth);
    return(
        <Route
            {...rest}
            render={props =>
                auth.isAuthenticated === true ? (
                    <div>
                        <Header/>
                        <div className="content ht-100v pd-0">
                            <Search/>
                            <Component {...props} />
                        </div>
                    </div>
                ) : (
                    <Redirect to="/"/>
                )
            }
        />
    )
};

export default PrivateRoute;
