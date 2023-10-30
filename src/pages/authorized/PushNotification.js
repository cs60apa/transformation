import React, {useEffect, useState} from 'react';
import {GET_COLLECTION_DATA} from '../../api';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import {Link} from "react-router-dom";
import cogoToast from "cogo-toast";
import {actionNotification} from "../../request";
import topics from "../../data/topics.json";
import {capitalize} from "../../utils/capitalize";

const PushNotification = () => {

    document.title = "Push Notification";

    const [stateReady, setStateReady] = useState(false);

    const token = localStorage.getItem('jwtToken');

    useEffect(() => {
        $("#topic_selected").val("");
        var table = $('#notification').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Notification list</p>'
            },
            "searching": true,
            "lengthMenu": [[10], [10]],
            ordering: false,
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
                        collection: "notification",
                        fieldname: "title",
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
                {"data": "raw"},
                {"data": "raw"}
            ],
            "columnDefs": [
                {
                    "render": function (data) {
                        return data.title
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return capitalize(data.status)
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return data.date
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return `${data.issued}`
                    },
                    "targets": 3
                },
                {
                    "render": function (data) {
                        return `<nav class="nav nav-icon-only">
                                    ${data.status === "draft" ? `<a href="#" class="nav-link delete_notification"><i class="fa fa-trash-alt"></i> Delete</a><a href="#" class="nav-link edit_notification"><i class="fa fa-pencil"></i> Edit</a>` : `<a href="#" class="nav-link delete_notification"><i class="fa fa-trash-alt"></i> Delete</a><a href="#" class="nav-link showModalInfo"><i class="fa fa-eye"></i> View</a>`}
                                </nav>`
                    },
                    "targets": 4
                }
            ]
        });

        $('#notification').on('click', '.delete_notification', function() {
            let extract_td = table.row($(this).closest('tr')).data();

            const options = {
                position: "top-right",
                hideAfter: 5
            };

            let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

            let data = {
                action: "delete",
                id: extract_td.raw._id
            }

            actionNotification(data).then((result) => {
                hide();
                const _options = {
                    position: "top-right"
                };

                if(result.error !== true) {
                    $('#notification').DataTable().ajax.reload(null, false);
                    cogoToast.success(result.data, _options);
                }
            });

            return false;
        });

        $('#notification').on('click', '.showModalInfo', function() {
            let extract_td = table.row($(this).closest('tr')).data();
            $("#md-topics").text(capitalize(extract_td.raw.topic));
            $("#md-title").text(extract_td.raw.title);
            $("#md-message").text(extract_td.raw.message);
            $("#md-date").text(extract_td.raw.date);
            $("#md-issued").text(`Issued By: ${extract_td.raw.issued}`);
            $("#modalInfo").modal("show");

            return false;
        });

        $('#notification').on('click', '.edit_notification', function() {
            let extract_td = table.row($(this).closest('tr')).data();
            $("#edit_title").text("Edit Notification");
            $("#edit_subtitle").text("Editing push notification");
            $("#topic_selected").val(extract_td.raw.topic);
            $("#title").val(extract_td.raw.title);
            $("#message").val(extract_td.raw.message);
            $("#modalAddUser").modal("show");

            return false;
        });

    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        let data = {
            action: "create",
            topic: $("#topic_selected").val(),
            title: $("#title").val(),
            message: $("#message").val()
        };

        setStateReady(true);
        actionNotification(data).then((result) => {
           setStateReady(false);
            const options = {
                position: "top-right"
            };

            if(result.error !== true) {
                onCloseModal("modalNotification", "notification_form");
                $('#notification').DataTable().ajax.reload();
                return cogoToast.success(result.data, options);
            }
        });
    };

    const onCloseModal = (id, form) => {
        $(':input',`#${form}`)
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
        $(`#${id}`).modal("hide");
        $(`#${form}`).parsley().reset();
        $(".modal-backdrop").remove();
    };

    const handleShowModal = () => {
        $("#edit_title").text("Add New");
        $("#edit_subtitle").text("Add new push notification");

        $("#modalNotification").modal({backdrop: 'static', keyboard: false}, "show");
    };

    const resendNotification = () => {
        const options = {
            position: "top-right",
            hideAfter: 0
        };

        let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

        let data = {
            action: "create",
            topic: $("#md-topics").text().toLowerCase(),
            title: $("#md-title").text(),
            message: $("#md-message").text()
        };

        actionNotification(data).then((result) => {
            hide();
            const _options = {
                position: "top-right"
            };

            if(result.error !== true) {
                $("#modalInfo").modal("hide");
                $(".modal-backdrop").remove();
                $('#notification').DataTable().ajax.reload();
                cogoToast.success(result.data, _options);
            }
        });
    };

    const reloadTable = () => {
        $('#notification').DataTable().ajax.reload();
    };

    let renderButton = () => {
        if(stateReady === true) {
            return(
                <button disabled className="btn btn-brand-02 btn-block">
                    <span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>
                    Please Wait</button>
            )
        } else {
            return(
                <button className="btn btn-brand-02 btn-block">Send Message</button>
            );
        }
    };

    return (
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Push Notification</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Push Notification</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleShowModal.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Message List</h6>
                                <div className="d-flex tx-18">
                                    <Link to="#" onClick={reloadTable.bind()} className="link-03 lh-0"><i className="icon ion-md-refresh"></i></Link>
                                </div>
                            </div>
                            <div className="card-body">
                                <table id="notification" className="table">
                                    <thead>
                                    <tr>
                                        <th className="wd-20p">Title</th>
                                        <th className="wd-20p">Status</th>
                                        <th className="wd-20p">Date</th>
                                        <th className="wd-20p">Issued</th>
                                        <th className="wd-20p">Actions</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="modal fade" id="modalNotification" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                            <div className="modal-content">
                                <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                    <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </a>
                                    <div className="media-body">
                                        <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalNotification", "notification_form")} aria-label="Close">
                                            <span aria-hidden="true">×</span>
                                        </a>
                                        <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Add New</h4>
                                        <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Add new push notification</p>
                                    </div>
                                </div>
                                <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                    <form id="notification_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleSubmit.bind()}>
                                        <div id="nameWrapper" className="form-group parsley-input">
                                            <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Topics</label>
                                            <select className="custom-select"
                                                    id="topic_selected"
                                                    required>
                                                <option value="" disabled>Select</option>
                                                {topics.map((result) => <option key={result} value={result}>{capitalize(result)}</option>)}
                                            </select>
                                        </div>

                                        <div id="titleWrapper" className="form-group parsley-input">
                                            <label>Title</label>
                                            <input id="title" type="text" className="form-control"
                                                   placeholder="Enter title"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#titleWrapper" required/>
                                        </div>

                                        <div id="messageWrapper" className="form-group parsley-input">
                                            <label>Message</label>
                                            <textarea id="message" className="form-control" rows="4" data-parsley-required data-parsley-class-handler="#messageWrapper" data-parsley-validation-threshold="10" placeholder="Enter Message..."></textarea>
                                        </div>

                                        {renderButton()}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal fade" id="modalInfo" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content bd-0 bg-transparent">
                                <div className="modal-body pd-0">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15 z-index-10"
                                       data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </a>

                                    <div className="row no-gutters">
                                        <div className="col-12 col-sm-12 col-md-6 col-lg-12 bg-white rounded-right">
                                            <div className="ht-100p d-flex flex-column justify-content-center pd-20 pd-sm-30 pd-md-40">
                                                <span className="tx-color-04">
                                                    <i className="wd-40 ht-40 stroke-wd-3 mg-b-20 fa fa-bells fa-2x"></i>
                                                </span>
                                                <h3 className="tx-16 tx-sm-20 tx-md-24 mg-b-15 mg-md-b-20" id="md-title">Title</h3>
                                                <p className="tx-14 tx-md-16 tx-color-02" id="md-message">No Message to show</p>
                                                <p className="tx-12 tx-md-13 tx-color-02 mg-b-25" id="md-date">No Date</p>
                                                <span id="md-topics">No topics</span>
                                                <p className="tx-12 tx-md-13 tx-color-03 mg-b-25" id="md-issued">No Issued</p>
                                                <button className="btn btn-dark float-left" onClick={resendNotification.bind()}><i className="fa fa-paper-plane"/> Resend</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default PushNotification;
