import React from "react";
import $ from "jquery";
import {Link} from 'react-router-dom';
import {useDispatch} from "react-redux";
import cogoToast from "cogo-toast";

const Search = () => {

    const dispatch = useDispatch();

    const querySearch = () => {

        const error = {
            position: "top-right",
            hideAfter: 3
        };

        let query = $('#query_value').val();
        if(!query) {
            cogoToast.error("Enter phone number or email address.", error);
            return false;
        }

        const options = {
            position: "top-right",
            hideAfter: 0
        };

        let {hide} = cogoToast.loading('Please wait... Searching User Data.', options);
    };

    return (
        <div className="content-header">
            <div className="content-search">
                <i data-feather="search"></i>
                <input type="search" id="query_value" className="form-control" placeholder="Search user"/>
            </div>
            <nav className="nav">
                <Link to="#" onClick={querySearch.bind()} className="nav-link"><i data-feather="arrow-right-circle"></i></Link>
            </nav>
        </div>
    );
};

export default Search;
