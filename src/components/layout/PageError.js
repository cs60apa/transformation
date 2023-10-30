import React from 'react';
import { Link } from 'react-router-dom';
import $ from "jquery";
import feather from "feather-icons";

const PageError = () => {

    document.title = "Page Not Found";

    $(function () {
        feather.replace();
    });

    return (
        <div className="content content-fixed content-auth-alt">
            <div className="container ht-100p">
                <div className="ht-100p d-flex flex-column align-items-center justify-content-center">
                    <div className="container ht-100p">
                        <div className="ht-100p d-flex flex-column align-items-center justify-content-center">
                            <div className="wd-80p wd-sm-300 mg-b-15 tx-center"><i className="fa-5x fal fa-exclamation-square tx-danger"/></div>
                            <h4 className="tx-20 tx-sm-24 tx-center">Wrong Page</h4>
                            <p className="tx-color-03 mg-b-40">This is not the page you are looking for or something went wrong.</p>
                            <div className="tx-13 tx-lg-14 mg-b-40 tx-center">
                                <Link to="/" className="btn btn-brand-02 d-inline-flex align-items-center">Home Page</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageError;
