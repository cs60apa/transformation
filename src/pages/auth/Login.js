import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import 'parsleyjs';
import { loginUser } from '../../request';
import $ from "jquery";

const Login = (props) => {

    document.title = "Sign In";

    const dispatch = useDispatch();
    //Selector
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [stateReady, setStateReady] = useState(false);

    $(function () {
        $('#login').parsley();

        return () => {
            $('#login').parsley().destroy();
        }
    });

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const result = {
            email: email,
            password: password
        };

        setStateReady(true);
        dispatch(loginUser(result)).then(() => {
            setStateReady(false);
        });
    };

    if(isAuthenticated) {props.history.push('/dashboard')}

    return (
        <div>
            <div className="content content-fixed content-auth">
                <div className="container">
                    <div className="media align-items-stretch justify-content-center ht-70p pos-relative">
                        <div className="sign-wrapper">
                            <div className="wd-100p">
                                <div className="text-center">
                                    <img src="assets/img/padlock.svg" className="ht-80 mg-b-20 img-fluid" alt="logo"/>
                                </div>
                                <h3 className="tx-color-01 text-center mg-b-10 tx-18">ZStudy Management</h3>
                                <p className="tx-color-03 text-center tx-16 mg-b-40">Sign In to continue.</p>
                                <form id="login" className="parsley-style-1" data-parsley-validate="true" onSubmit={handleSubmit.bind()}>
                                    <div id="emailWrapper" className="form-group parsley-input">
                                        <label>Email address</label>
                                        <input id="email" type="email" className="form-control"
                                               placeholder="Enter your email address"
                                               value={email}
                                               onChange={handleEmailChange.bind()}
                                               autoComplete="off"
                                               data-parsley-class-handler="#emailWrapper" required/>
                                    </div>
                                    <div id="passwordWrapper" className="form-group parsley-input">
                                        <div className="mg-b-5">
                                            <label className="mg-b-0-f">Password</label>
                                        </div>
                                        <input id="password" type="password" className="form-control"
                                               placeholder="Enter your password"
                                               value={password}
                                               data-parsley-minlength="6"
                                               onChange={handlePasswordChange.bind()}
                                               data-parsley-class-handler="#passwordWrapper" required/>
                                    </div>
                                    {stateReady ? <button className="btn btn-dark btn-block" disabled><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Loading</button> : <button className="btn btn-dark btn-block">Sign In</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Login;
