import React, { useEffect } from 'react';
import {GET_COLLECTION_DATA} from '../../api';
import {getUserReport} from '../../request/users';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import moment from "moment";
import formatNumber from "../../utils/formatNumber";

const Dashboard = () => {

    document.title = "Dashboard";

    const token = localStorage.getItem('jwtToken');

    useEffect(() => {
        getUserReport().then((response) => {
            if(!response.error) {
                $('#total-users').text(formatNumber(response.payload.total));
                $('#date-current').text(response.payload.date_current);
                $('#month-current').text(response.payload.month_current);
                $('#daily-active').text(formatNumber(response.payload.daily));
                $('#monthly-active').text(formatNumber(response.payload.monthly));
            }
        });

        $('#user').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting User Report</p>'
            },
            "searching": true,
            "lengthMenu": [[10], [10]],
            ordering: false,
            searchDelay: 650,
            info: true,
            bFilter: false,
            processing: true,
            pageLength: 10,
            serverSide: true,
            ajax: function(data, callback) {
                // make a regular ajax request using data.start and data.length
                $.ajax(GET_COLLECTION_DATA, {
                    type: 'POST',
                    headers: {
                        "Authorization": token
                    },
                    data: {
                        query: $('.dataTables_filter input').val(),
                        collection: "user",
                        fieldname: "email",
                        pageSize: data.start,
                        format: 'json',
                        pageIndex: (data.length + data.start) / data.length
                    },
                    success : function(res) {
                        let array = [];
                        res.data.map((data) => {array.push({raw: data})});
                        callback({
                            recordsTotal: res.total,
                            recordsFiltered: res.total,
                            data: array
                        });
                    }
                });
            },
            "columns": [
                {"data": "raw"},
                {"data": "raw"},
                {"data": "raw"},
                {"data": "raw"}
            ],
            "columnDefs": [
                {
                    "render": function (data) {
                        return data.mobileNumber || "not_set";
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return data.firstName ? `${data.firstName} ${data.lastName}` : "Not set";
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return data.email;
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return moment(data.date.str).format("Do MMM, YYYY");
                    },
                    "targets": 3
                },
            ]
        });
    }, []);

    return (
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Users</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Users</h4>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-sm-6 col-lg-4">
                        <div className="card card-body">
                            <h6 className="tx-uppercase tx-11 tx-spacing-1 tx-primary tx-semibold mg-b-8">Total Registered Users</h6>
                            <div className="d-flex d-lg-block d-xl-flex align-items-end">
                                <h3 id="total-users" className="tx-normal tx-rubik mg-b-0 mg-r-5 lh-1">-</h3>
                            </div>
                            <span className="tx-11 tx-color-02 mg-b-0 mg-t-5">Since 12th June, 2019</span>
                        </div>
                    </div>
                    <div className="col-sm-6 col-lg-4 mg-t-10 mg-lg-t-0">
                        <div className="card card-body">
                            <h6 className="tx-uppercase tx-11 tx-spacing-1 tx-primary tx-semibold mg-b-8">Registered Users Today</h6>
                            <div className="d-flex d-lg-block d-xl-flex align-items-end">
                                <h3 id="daily-active" className="tx-normal tx-rubik mg-b-0 mg-r-5 lh-1">0</h3>
                            </div>
                            <span id="date-current" className="tx-11 tx-color-02 mg-b-0 mg-t-5">-</span>
                        </div>
                    </div>
                    <div className="col-sm-6 col-lg-4 mg-t-10 mg-sm-t-0">
                        <div className="card card-body">
                            <h6 className="tx-uppercase tx-11 tx-spacing-1 tx-primary tx-semibold mg-b-8">Registered Users Monthly</h6>
                            <div className="d-flex d-lg-block d-xl-flex align-items-end">
                                <h3 id="monthly-active" className="tx-normal tx-rubik mg-b-0 mg-r-5 lh-1">0</h3>
                            </div>
                            <span id="month-current" className="tx-11 tx-color-02 mg-b-0 mg-t-5">-</span>
                        </div>
                    </div>

                    <div className="col-md-12 mg-t-10">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Total Users</h6>
                                <div className="d-flex tx-18">
                                    <a href="" className="link-03 lh-0"><i className="icon ion-md-refresh"></i></a>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="user" className="table table-hover">
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-25p">ID</th>
                                        <th className="wd-25p">Full Name</th>
                                        <th className="wd-25p">Email Address</th>
                                        <th className="wd-25p">Date</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Dashboard;
