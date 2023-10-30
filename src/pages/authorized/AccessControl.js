import React, {useEffect, useState} from 'react';
import {GET_COLLECTION_DATA} from '../../api';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import {Link} from "react-router-dom";
import cogoToast from "cogo-toast";
import {actionAdmin} from "../../request";
import {capitalize} from "../../utils/capitalize";
import {useSelector} from "react-redux";
import errorHandler from "../../utils/errorHandler";

const AccessControl = () => {

    document.title = "Access Control";

    const id = useSelector((state) => state.auth.user.user.sub);
    const [stateReady, setStateReady] = useState(false);
    const [editForm, setEditForm] = useState(false);

    const token = localStorage.getItem('jwtToken');

    useEffect(() => {

        var table = $('#admin').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting admin list</p>'
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
                        collection: "admin",
                        fieldname: "name",
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
                        return data.name
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return data.email
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return capitalize(data.role)
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return `${data.permission.create ? "C": ""}${data.permission.update ? "U": ""}${data.permission.delete ? "D": ""}`;
                    },
                    "targets": 3
                },
                {
                    "render": function () {
                        return `<nav class="nav nav-icon-only"><a href="#" class="nav-link edit_user"><i class="fa fa-pencil"></i> Edit</a> <a href="#" class="nav-link delete_user"><i class="fa fa-trash-alt"></i> Delete</a></nav>`
                },
                    "targets": 4
                }
            ]
        });

        $('#admin').on('click', '.delete_user', function() {
            let extract_td = table.row($(this).closest('tr')).data();

            const options = {
                position: "top-right",
                hideAfter: 0
            };

            if(extract_td.raw._id === id) {
                cogoToast.error('Sorry, this logged account cannot be deleted.', options);
                return false;
            }

            let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

            let data = {
                id: extract_td.raw._id,
                action: "delete"
            }

            actionAdmin(data).then((result) => {
                hide();
                const _options = {
                    position: "top-right"
                };

                if(result.error === false) {
                    $('#admin').DataTable().ajax.reload(null, false);
                    cogoToast.success(result.data, _options);
                } else {
                    cogoToast.error(result.data, _options);
                }
            });

            return false;
        });

        $('#admin').on('click', '.edit_user', function() {
            let extract_td = table.row($(this).closest('tr')).data();
            setEditForm(true);

            $("#name").prop('disabled', true);
            $("#email").prop('disabled', true);
            $("#password").prop('required', false);

            $("#name").val(extract_td.raw.name);
            $("#email").val(extract_td.raw.email);
            $('#b1a').prop({checked: extract_td.raw.permission.create});
            $('#b2a').prop({checked: extract_td.raw.permission.update});
            $('#b3a').prop({checked: extract_td.raw.permission.delete});

            $("#modalUser").modal("show");

            return false;
        });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        setStateReady(true);

        const options = {
            position: "top-right",
            hideAfter: 0
        };

        let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

        let data = {
            action: "create",
            name: $('#name').val(),
            email: $('#email').val(),
            password: $('#password').val(),
            permission: {
                create: $('#b1a').is(':checked'),
                update: $('#b2a').is(':checked'),
                delete: $('#b3a').is(':checked'),
            }
        };

        if(editForm === true) {
            data.action = "update";
            actionAdmin(data).then((result) => {
                hide();
                const _options = {
                    position: "top-right"
                };

                setStateReady(false);

                if(result.error !== true) {
                    onCloseModal("modalUser", "user_form");
                    $("#modalAddUser").modal("hide");
                    $(".modal-backdrop").remove();
                    $('#admin').DataTable().ajax.reload();
                    return cogoToast.success(result.data, _options);
                }

                errorHandler(result.data, 'top-right');
            });

            return false;
        }

        actionAdmin(data).then((result) => {
            hide();
            const _options = {
                position: "top-right"
            };

            setStateReady(false);

            if(result.error !== true) {
                onCloseModal("modalUser", "user_form");
                $("#modalAddUser").modal("hide");
                $(".modal-backdrop").remove();
                $('#admin').DataTable().ajax.reload();
                return cogoToast.success(result.data, _options);
            }

            errorHandler(result.data, 'top-right');
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
        setEditForm(false);

        $("#name").prop('disabled', false);
        $("#email").prop('disabled', false);
        $("#password").prop('required', true);

        $("#modalUser").modal({backdrop: 'static', keyboard: false}, "show");
    };

    const reloadTable = () => {
        $('#admin').DataTable().ajax.reload();
    };

    let renderButton = () => {
        if(stateReady === true) {
            return(
                <button disabled className="btn btn-brand-02 btn-block">
                    <span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>
                    Please Wait</button>
            )
        } else {
            return editForm ? <button className="btn btn-brand-02 btn-block">Update Account</button> : <button className="btn btn-brand-02 btn-block">Create Account</button>
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
                                <li className="breadcrumb-item active" aria-current="page">Access Control</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Access Control</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleShowModal.bind()}><i className="wd-10 mg-r-5 fa fa-user-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">User List</h6>
                                <div className="d-flex tx-18">
                                    <Link to="#" onClick={reloadTable.bind()} className="link-03 lh-0"><i className="icon ion-md-refresh"></i></Link>
                                    {/*<a href="" className="link-03 lh-0 mg-l-10"><i className="icon ion-md-more"></i></a>*/}
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="admin" className="table table-hover">
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-20p">Name</th>
                                        <th className="wd-20p">Email</th>
                                        <th className="wd-20p">Role</th>
                                        <th className="wd-20p">Permission</th>
                                        <th className="wd-20p">Actions</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="modalUser" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                            <div className="modal-content">
                                <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                    <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </a>
                                    <div className="media-body"><a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalUser", "user_form")} aria-label="Close"><span aria-hidden="true">×</span></a><h4 className="tx-18 tx-sm-20 mg-b-2">{editForm ? "Edit User" : "Create User"}</h4><p className="tx-13 tx-color-02 mg-b-0">{editForm ? "Edit" : "Create"} user to have access to the console</p></div>
                                </div>
                                <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                    <form id="user_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleSubmit.bind()}>
                                        <div id="nameWrapper" className="form-group parsley-input">
                                            <label>Full Name<span className="tx-danger">*</span></label>
                                            <input id="name" type="text" className="form-control"
                                                   placeholder="Enter full name"
                                                   autoComplete="none"
                                                   data-parsley-class-handler="#nameWrapper" required/>
                                        </div>

                                        <div id="emailWrapper" className="form-group parsley-input">
                                            <label>Email Address<span className="tx-danger">*</span></label>
                                            <input id="email" type="email" className="form-control"
                                                   placeholder="Enter valid email address"
                                                   autoComplete="none"
                                                   data-parsley-class-handler="#emailWrapper" required/>
                                        </div>

                                        <div id="passwordWrapper" className="form-group parsley-input">
                                            <label>Password<span className="tx-danger">*</span></label>
                                            <input id="password" type="password" className="form-control"
                                                   placeholder="Enter new passowrd"
                                                   autoComplete="none"
                                                   data-parsley-class-handler="#passwordWrapper"/>
                                        </div>

                                        <div className="form-group">
                                            <div data-label="Access Privilege" className="df-example mg-b-5">
                                                <div id="cbWrapper2" className="parsley-checkbox pos-relative">
                                                    <div className="custom-control custom-checkbox">
                                                        <input className="custom-control-input" type="checkbox" name="_form[]"
                                                               data-parsley-mincheck="1"
                                                               data-parsley-class-handler="#cbWrapper2"
                                                               data-parsley-errors-container="#cbErrorContainer2"
                                                               required
                                                               data-parsley-multiple="_form" id="b1a"/>
                                                        <label className="custom-control-label" htmlFor="b1a">Create</label>
                                                    </div>

                                                    <div className="custom-control custom-checkbox">
                                                        <input className="custom-control-input" type="checkbox"
                                                               name="_form[]"
                                                               data-parsley-multiple="_form"
                                                               id="b2a"/>
                                                        <label className="custom-control-label" htmlFor="b2a">Update</label>
                                                    </div>

                                                    <div className="custom-control custom-checkbox">
                                                        <input className="custom-control-input" type="checkbox"
                                                               name="_form[]"
                                                               data-parsley-multiple="_form"
                                                               id="b3a"/>
                                                        <label className="custom-control-label" htmlFor="b3a">Delete</label>
                                                    </div>

                                                    <div id="cbErrorContainer2" className="wd-100p pos-absolute b-0 l-0"/>
                                                </div>
                                            </div>
                                        </div>

                                        {renderButton()}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default AccessControl;
