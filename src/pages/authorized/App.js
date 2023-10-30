import React, { useEffect, useState } from 'react';
import {useDispatch, useSelector} from 'react-redux';
import $ from 'jquery';
import 'parsleyjs';
import {
    paymentActivation,
    updateCompany,
    updatePassword,
    deletePackage,
    addNewPackage,
    deleteCategory, addNewCategory, getCategory
} from "../../request";
import Cleave from 'cleave.js/react';
import 'cleave.js/dist/addons/cleave-phone.i18n';
import {GET_COLLECTION_DATA, GET_DATA_LIST} from "../../api";
import cogoToast from "cogo-toast";
import {capitalize} from "../../utils/capitalize";

const App = () => {
    const token = localStorage.getItem('jwtToken');

    document.title = "App Settings";

    const [stateReady, setStateReady] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [lifetime, setLifetime] = useState(false);
    const [packageId, setPackageId] = useState(null);
    const [editForm, setEditForm] = useState(false);

    useEffect(() => {
        $('#account').parsley();
        $('#change_password').parsley();

        let td_subscription = $('#td_subscription').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Please Wait</p>'
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
                        collection: "package",
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
                        return data.title;
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return data.description;
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return `K${data.amount}`;
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return data.lifetime ? "Infinite" : data.duration;
                    },
                    "targets": 3
                },
                {
                    "render": function (data) {
                        return `<nav class="nav nav-icon-only">
                                    <a href="#" class="nav-link edit_package"><i class="fa fa-pencil-alt"></i> Edit</a><a href="#" class="nav-link delete"><i class="fa fa-trash-alt"></i> Delete</a>
                                </nav>`
                    },
                    "targets": 4
                }
            ]
        });

        let td_payment = $('#td_payment').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Please Wait</p>'
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
                        collection: "payment",
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
                {"data": "raw"}
            ],
            "columnDefs": [
                {
                    "render": function (data) {
                        return `<nav class="nav nav-icon-only">
                                    <img src=${data.logo_url} class="mg-r-5" height="15"/> ${data.title}
                                </nav>`;
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return data.description;
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return {
                            true : `<span class="badge badge-success tx-white">Active</span>`,
                            false : `<span class="badge badge-danger tx-white">Inactive</span>`
                        }[data.active];
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return `<nav class="nav nav-icon-only">
                                    ${data.active ? `<a href="#" class="nav-link activate"><i class="fa fa-stop-circle"></i> Deactivate</a>` : `<a href="#" class="nav-link activate"><i class="fa fa-power-off"></i> Activate</a>`}
                                </nav>`
                    },
                    "targets": 3
                }
            ]
        });

        $('#td_payment').on('click', '.activate', function(e) {
            e.preventDefault();
            let extract_td = td_payment.row($(this).closest('tr')).data();

            let {hide} = cogoToast.loading('Please wait... contacting to server.', {position: "top-right"});
            paymentActivation(extract_td.raw._id, "activate_payment").then((response) => {
                hide();
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    $('#td_payment').DataTable().ajax.reload()
                }
            });
        });

        $('#td_subscription').on('click', '.delete', function(e) {
            e.preventDefault();
            let extract_td = td_subscription.row($(this).closest('tr')).data();

            let {hide} = cogoToast.loading('Please wait... contacting to server.', {position: "top-right"});
            deletePackage(extract_td.raw._id, "delete_package").then((response) => {
                hide();
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    $('#td_subscription').DataTable().ajax.reload();
                }
            });
        });

        $('#td_subscription').on('click', '.edit_package', function(e) {
            e.preventDefault();
            let extract_td = td_subscription.row($(this).closest('tr')).data();
            setPackageId(extract_td.raw._id);
            setEditForm(true);
            $("#title").val(extract_td.raw.title);
            $("#packageDescription").val(extract_td.raw.description);
            $("#amount").val(extract_td.raw.amount);
            $("#checked").prop("checked", extract_td.raw.lifetime).prop("disabled", true);
            $("#duration").prop("disabled", true).prop("required", false);

            $("#modalPackage").modal({backdrop: 'static', keyboard: false}, "show");
        });

    }, []);

    const handleAddPackage = (e) => {
        e.preventDefault();
        setEditForm(false);
        $("#checked").prop("checked", false).prop("disabled", false);
        $("#duration").prop("disabled", false).prop("required", true);
        $('#package_form').parsley();
        $("#modalPackage").modal({backdrop: 'static', keyboard: false}, "show");
    };

    const handlePackageSubmit = (e) => {
        e.preventDefault();

        setFormLoading(true);

        let title = $("#title").val();
        let description = $("#packageDescription").val();
        let amount = $("#amount").val();

        let raw = {
            title: title,
            description: description,
            amount: amount,
            lifetime: lifetime,
            duration: lifetime ? 0:  $("#duration").val(),
            action: "add_package"
        }

        if(editForm) {
            let _raw = {
                id: packageId,
                title: title,
                description: description,
                amount: amount,
                action: "update_package"
            }

            addNewPackage(_raw).then((response) => {
                setFormLoading(false);
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    onCloseModal("modalPackage", "package_form");
                    $('#td_subscription').DataTable().ajax.reload();
                }

                return false;
            });

            return false;
        }

        addNewPackage(raw).then((response) => {
            setFormLoading(false);
            if(!response.error) {
                cogoToast.success(response.payload, {position: "top-right"});
                onCloseModal("modalPackage", "package_form");
                $('#td_subscription').DataTable().ajax.reload();
            }

            return false;
        });
    };

    const onCloseModal = (id, form) => {
        $(':input',`#${form}`)
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
        $(`#${form}`).parsley().reset();
        $(`#${id}`).modal("hide");
        $(".modal-backdrop").remove();
    };

    const handle_check = () => {
        if($('#checked').is(':checked')){
            setLifetime(true);
            $("#duration").prop('disabled', true).prop('required', false);
        } else {
            setLifetime(false);
            $("#duration").prop('disabled', false).prop('required', true);
        }
    }

    return (
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
                                <li className="breadcrumb-item active" aria-current="page">App</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">App</h4>
                    </div>
                </div>

                <div className="card card-body pd-x-25 pd-sm-x-30 pd-t-15 pd-sm-t-20 pd-b-15 pd-sm-b-20">
                    <div className="nav-wrapper mg-b-20 tx-13">
                        <div>
                            <nav className="nav nav-line tx-medium">
                                <a href="#subscription_tab" className="nav-link active" data-toggle="tab">Subscription</a>
                                <a href="#payment_tab" className="nav-link" data-toggle="tab">Payment</a>
                            </nav>
                        </div>
                    </div>

                    <div className="tab-content">
                        <div id="subscription_tab" className="tab-pane fade active show">
                            <div className="row row-sm">
                                <div className="col-md-12">
                                    <div className="card">
                                        <div className="card-header d-flex align-items-center justify-content-between">
                                            <h6 className="mg-b-0">Packages</h6>
                                            <div className="d-flex tx-18">
                                                <a href="javascript:void(0)" className="link-03 lh-0" onClick={handleAddPackage.bind()}><i className="icon ion-md-add"></i></a>
                                                <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={() => $('#td_subscription').DataTable().ajax.reload()}><i className="icon ion-md-refresh"></i></a>
                                            </div>
                                        </div>
                                        <div className="card-body table-responsive">
                                            <table id="td_subscription" className="table table-hover" style={{width: "100%"}}>
                                                <thead className="thead-light">
                                                <tr>
                                                    <th className="wd-20p">Name</th>
                                                    <th className="wd-20p">Description</th>
                                                    <th className="wd-20p">Amount</th>
                                                    <th className="wd-20p">Duration</th>
                                                    <th className="wd-20p">Action</th>
                                                </tr>
                                                </thead>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="payment_tab" className="tab-pane fade">
                            <div className="row row-sm">
                                <div className="col-md-12">
                                    <div className="card">
                                        <div className="card-header d-flex align-items-center justify-content-between">
                                            <h6 className="mg-b-0">Payment Method</h6>
                                        </div>
                                        <div className="card-body table-responsive">
                                            <table id="td_payment" className="table table-hover" style={{width: "100%"}}>
                                                <thead className="thead-light">
                                                <tr>
                                                    <th className="wd-25p">Name</th>
                                                    <th className="wd-25p">Description</th>
                                                    <th className="wd-25p">Status</th>
                                                    <th className="wd-25p">Action</th>
                                                </tr>
                                                </thead>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalPackage" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalPackage", "package_form")} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Package</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="package_form" className="parsley-style-1" onSubmit={handlePackageSubmit.bind()}>
                                    <div id="titleWrapper" className="form-group parsley-input">
                                        <label>Title<span className="tx-danger">*</span></label>
                                        <input id="title" type="text" className="form-control"
                                               placeholder="Enter package name"
                                               autoComplete="off"
                                               data-parsley-class-handler="#titleWrapper" required/>
                                    </div>

                                    <div id="packageDescriptionWrapper" className="form-group parsley-input">
                                        <label>Description<span className="tx-danger">*</span></label>
                                        <textarea id="packageDescription" type="text" rows="5" className="form-control" placeholder="Provide a description" data-parsley-class-handler="#packageDescriptionWrapper" required></textarea>
                                    </div>

                                    <div id="amountWrapper" className="form-group parsley-input">
                                        <label>Amount<span className="tx-danger">*</span></label>
                                        <input id="amount" type="number" className="form-control"
                                               placeholder="Enter amount"
                                               autoComplete="off"
                                               data-parsley-class-handler="#amountWrapper" required/>
                                    </div>

                                    <div className="custom-control custom-checkbox mg-b-10">
                                        <input className="custom-control-input" type="checkbox" name="checked[]"
                                               onChange={handle_check.bind()}
                                               id="checked"/>
                                        <label className="custom-control-label" htmlFor="checked">Lifetime Subscription</label>
                                    </div>

                                    <div id="durationWrapper" className="form-group parsley-input">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Duration<span className="tx-danger">*</span></label>
                                        <select className="custom-select" id="duration" required>
                                            <option value="" disabled selected>Select</option>
                                            <option value="7">7 Weeks</option>
                                            <option value="30">1 Month</option>
                                            <option value="90">3 Months</option>
                                            <option value="180">6 Months</option>
                                            <option value="180">12 Months</option>
                                        </select>
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> {editForm ? "Update Package" : "Add Package"}</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default App;
