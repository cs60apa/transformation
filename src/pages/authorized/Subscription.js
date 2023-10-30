import React, { useEffect } from 'react';
import {GET_COLLECTION_DATA} from '../../api';
import {getSubscriptionReport} from '../../request/users';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import moment from "moment";
import formatNumber from "../../utils/formatNumber";

const Subscription = () => {

    document.title = "Subscription";

    const token = localStorage.getItem('jwtToken');

    useEffect(() => {
        getSubscriptionReport().then((response) => {
            if(!response.error) {
                $('#total-subscriber').text(formatNumber(response.payload.total));
                $('#date-current').text(response.payload.date_current);
                $('#daily-active').text(response.payload.daily);
                $('#total-transaction').text(`K${formatNumber(response.payload.transaction)}`);
            }
        });

        let table = $('#subscription').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Subscription Report</p>'
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
                        collection: "subscription",
                        fieldname: "email_address",
                        pageSize: data.start,
                        format: 'json',
                        populate: 'user transaction course',
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
                {
                    className: 'dt-control',
                    orderable: false,
                    data: null,
                    defaultContent: '',
                },
                {"data": "raw"},
                {"data": "raw"},
                {"data": "raw"},
                {"data": "raw"},
                {"data": "raw"}
            ],
            "columnDefs": [
                {
                    "render": function () {
                        return null;
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return `${data.user.email}`;
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return `K${data.transaction.amount}`;
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return {
                            paid : `<span class="badge badge-success tx-white">Paid</span>`,
                            pending : `<span class="badge badge-warning tx-white">Pending</span>`,
                            failed : `<span class="badge badge-danger tx-white">Failed</span>`
                        }[data.status];
                    },
                    "targets": 3
                },
                {
                    "render": function (data) {
                        return data.transaction.momo_phone_number !== null ? "MoMo" : "Credit Card";
                    },
                    "targets": 4
                },
                {
                    "render": function (data) {
                        return moment(data.date.iso).format("Do MMM, YYYY");
                    },
                    "targets": 5
                }
            ]
        });

        $('#subscription tbody').on('click', 'td.dt-control', function () {
            let tr = $(this).closest('tr');
            let row = table.row(tr);

            if (row.child.isShown()) {
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
            } else {
                // Open this row
                row.child(format(row.data())).show();
                tr.addClass('shown');
            }
        });

        function format(d) {
            // `d` is the original data object for the row
            return (
              '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
              '<tr>' +
              '<td>Course:</td>' +
              '<td>' +
              d.raw.course.name +
              '</td>' +
              '</tr>' +
              '<tr>' +
              '<td>Expiry:</td>' +
              '<td>' +
              moment(d.raw.due_date.iso).format("Do MMM, YYYY")+
              '</td>' +
              '</tr>' +
              '<tr>' +
              '<td>Source:</td>' +
              '<td>Web</td>' +
              '</tr>' +
              '</table>'
            );
        }

    }, []);

    return (
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Subscriptions</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Subscriptions</h4>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-sm-6 col-lg-4">
                        <div className="card card-body">
                            <h6 className="tx-uppercase tx-11 tx-spacing-1 tx-primary tx-semibold mg-b-8">Total Subscribers</h6>
                            <div className="d-flex d-lg-block d-xl-flex align-items-end">
                                <h3 id="total-subscriber" className="tx-normal tx-rubik mg-b-0 mg-r-5 lh-1">-</h3>
                            </div>
                            <span className="tx-11 tx-color-02 mg-b-0 mg-t-5">Since 12th June, 2019</span>
                        </div>
                    </div>
                    <div className="col-sm-6 col-lg-4 mg-t-10 mg-lg-t-0">
                        <div className="card card-body">
                            <h6 className="tx-uppercase tx-11 tx-spacing-1 tx-primary tx-semibold mg-b-8">Total Subscription Today</h6>
                            <div className="d-flex d-lg-block d-xl-flex align-items-end">
                                <h3 id="daily-active" className="tx-normal tx-rubik mg-b-0 mg-r-5 lh-1">0</h3>
                            </div>
                            <span id="date-current" className="tx-11 tx-color-02 mg-b-0 mg-t-5">-</span>
                        </div>
                    </div>
                    <div className="col-sm-6 col-lg-4 mg-t-10 mg-sm-t-0">
                        <div className="card card-body">
                            <h6 className="tx-uppercase tx-11 tx-spacing-1 tx-primary tx-semibold mg-b-8">Total Transactions</h6>
                            <div className="d-flex d-lg-block d-xl-flex align-items-end">
                                <h3 id="total-transaction" className="tx-normal tx-rubik mg-b-0 mg-r-5 lh-1">0</h3>
                            </div>
                            <span id="month-current" className="tx-11 tx-color-02 mg-b-0 mg-t-5">Up to Date</span>
                        </div>
                    </div>

                    <div className="col-md-12 mg-t-10">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Total Subscription</h6>
                                <div className="d-flex tx-18">
                                    <a href="" className="link-03 lh-0"><i className="icon ion-md-refresh"></i></a>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="subscription" className="table">
                                    <thead className="thead-light">
                                    <tr>
                                        <th></th>
                                        <th className="wd-20p">Name</th>
                                        <th className="wd-20p">Amount</th>
                                        <th className="wd-20p">Status</th>
                                        <th className="wd-20p">Payment Mode</th>
                                        <th className="wd-20p">Date</th>
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

export default Subscription;
