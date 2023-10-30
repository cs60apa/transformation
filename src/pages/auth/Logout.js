import React, { useEffect } from 'react';
import {useDispatch} from "react-redux";
import {logoutUser} from "../../request/auth";

const Logout = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(logoutUser());
        //Clear current profile
        window.location.href = "/";
    }, []);

    return (
        <div>
            <p className="tx-color-03">Session Destroyed</p>
        </div>
    )
};

export default Logout;
