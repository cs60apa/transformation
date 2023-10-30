import React, {useEffect, useState} from 'react';
import $ from "jquery";
import moment from "moment";
import {
    GET_COLLECTION_DATA,
    SEARCH_COLLECTION_URL
} from "../../api";
import 'datatables.net';
import 'datatables.net-responsive';
import cogoToast from "cogo-toast";
import {student, academic, getAcademia, academicCopyCourse} from "../../request";
import {capitalize} from "../../utils/capitalize";

const School = (props) => {

    const token = localStorage.getItem('jwtToken');

    const id = props.match.params.id;
    const [loading, setLoading] = useState(true);
    const [academia, setAcademia] = useState(null);
    const [editForm, setEditForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [datatable] = useState({
        academic: false
    });

    useEffect(() => {
        getAcademia(id).then((response) => {
            if(!response.error) {
                setAcademia(response.payload);
                setLoading(false);
                let td_student = $('#student-table').DataTable({
                    responsive: true,
                    language: {
                        searchPlaceholder: 'Search name',
                        sSearch: '',
                        lengthMenu: '_MENU_ items/page',
                        processing: '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Student Data</p>'
                    },
                    searching: true,
                    lengthMenu: [[10], [10]],
                    ordering: false,
                    info: true,
                    bFilter: false,
                    processing: true,
                    pageLength: 10,
                    serverSide: true,
                    ajax: function (data, callback) {
                        $.ajax(GET_COLLECTION_DATA, {
                            type: 'POST',
                            headers: {
                                "Authorization": token
                            },
                            data: {
                                query: $('.dataTables_filter input').val(),
                                collection: "students",
                                fieldname: "name",
                                filter: {
                                    academia: response.payload._id
                                },
                                pageSize: data.start,
                                populate: "grade",
                                format: 'json',
                                pageIndex: (data.length + data.start) / data.length
                            },
                            success: function (res) {
                                let array = [];
                                res.data.map((data) => {
                                    array.push({raw: data})
                                });
                                callback({
                                    recordsTotal: res.total,
                                    recordsFiltered: res.total,
                                    data: array
                                });
                            },
                            error: function(err) {
                                cogoToast.error( err.responseJSON['error'].details !== undefined ? err.responseJSON['error'].details[0].message : err.responseJSON['error'], {position: "top-right", hideAfter: 5});
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
                                return `${data.firstName} ${data.lastName}`;
                            },
                            "targets": 0
                        },
                        {
                            "render": function (data) {
                                return data.id_number;
                            },
                            "targets": 1
                        },
                        {
                            "render": function (data) {
                                return data.grade.map((item) => {
                                    return ` ${item.name}`
                                })
                            },
                            "targets": 2
                        },
                        {
                            "render": function (data) {
                                return moment(data.date.str).format("Do MMM, YYYY")
                            },
                            "targets": 3
                        },
                        {
                            "render": function () {
                                return `<nav class="nav nav-icon-only"><a href="#" class="nav-link delete_student"><i class="fa fa-pencil"></i> Delete</a></nav>`
                            },
                            "targets": 4
                        }
                    ]
                });

                td_student.on('click', '.delete_student', function(e) {
                    e.preventDefault();
                    let extract_td = td_student.row($(this).closest('tr')).data();
                    $(".data-message").text(`Are you sure, you want to delete, ${capitalize(extract_td.raw.firstName)}?`);
                    $('#delete-data').unbind("click").click(function(){

                        $("#modalConfirm").modal("hide");
                        $(".modal-backdrop").remove();

                        const options = {
                            position: "top-right",
                            hideAfter: 0
                        };

                        let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

                        let data = {
                            id: extract_td.raw._id,
                        }

                        student("delete", data).then((result) => {
                            hide();
                            if(!result.error) {
                                reloadTable();
                                cogoToast.success("Student successfully removed.", {position: "top-right"});
                            }
                        });
                    });

                    $("#modalConfirm").modal({ backdrop: 'static', focus: false, show: true });
                });
            }
        });
    }, []);

    const initializeSearch = () => {
        let modalStudent = $('#modalStudent');
        $('#grade-select2').select2({
            placeholder: 'Select grade or type name',
            allowClear: true,
            dropdownParent: modalStudent,
            ajax: {
                url: SEARCH_COLLECTION_URL,
                dataType: 'json',
                type: "POST",
                headers: {
                    "Authorization" : token,
                },
                data: function (query) {
                    return {
                        query: query,
                        collection: "grade"
                    };
                },
                processResults: function (data) {
                    return {
                        results: $.map(data, function (item) {
                            return {
                                text: capitalize(item.name),
                                id: item._id
                            }
                        })
                    };
                }
            }
        })
    }

    const _initializeSearch = () => {
        let modalAcademic = $('#modalAcademic');
        $('#course-select2').select2({
            placeholder: 'Select course or type name',
            allowClear: true,
            dropdownParent: modalAcademic,
            ajax: {
                url: SEARCH_COLLECTION_URL,
                dataType: 'json',
                type: "POST",
                headers: {
                    "Authorization" : token,
                },
                data: function (query) {
                    return {
                        query: query,
                        collection: "course"
                    };
                },
                processResults: function (data) {
                    return {
                        results: $.map(data, function (item) {
                            return {
                                text: capitalize(item.name),
                                id: item._id
                            }
                        })
                    };
                }
            }
        })

        $('#single-grade-select2').select2({
            placeholder: 'Select grade or type name',
            allowClear: true,
            dropdownParent: modalAcademic,
            maximumSelectionLength: 1,
            ajax: {
                url: SEARCH_COLLECTION_URL,
                dataType: 'json',
                type: "POST",
                headers: {
                    "Authorization" : token,
                },
                data: function (query) {
                    return {
                        query: query,
                        collection: "grade"
                    };
                },
                processResults: function (data) {
                    return {
                        results: $.map(data, function (item) {
                            return {
                                text: capitalize(item.name),
                                id: item._id
                            }
                        })
                    };
                }
            }
        })
    }

    const resetForm = (id, form) => {
        const parsley = $(`#${form}`).parsley();
        $(':input',`#${form}`)
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
        $(`#${id}`).modal("hide");
        parsley.reset();
        parsley.destroy();
        $(".modal-backdrop").remove();
    };

    const academicDatatable = () => {
        if(datatable.academic) return false;
        datatable.academic = true;
        let td_academic = $('#academic-table').DataTable({
            responsive: true,
            language: {
                searchPlaceholder: 'Search name',
                sSearch: '',
                lengthMenu: '_MENU_ items/page',
                processing: '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Academic Data</p>'
            },
            searching: true,
            lengthMenu: [[10], [10]],
            ordering: false,
            info: true,
            bFilter: false,
            processing: true,
            pageLength: 10,
            serverSide: true,
            ajax: function (data, callback) {
                $.ajax(GET_COLLECTION_DATA, {
                    type: 'POST',
                    headers: {
                        "Authorization": token
                    },
                    data: {
                        query: $('.dataTables_filter input').val(),
                        collection: "academics",
                        fieldname: "name",
                        filter: {
                            academia: academia._id
                        },
                        pageSize: data.start,
                        format: 'json',
                        populate: "category grade",
                        pageIndex: (data.length + data.start) / data.length
                    },
                    success: function (res) {
                        let array = [];
                        res.data.map((data) => {
                            array.push({raw: data})
                        });
                        callback({
                            recordsTotal: res.total,
                            recordsFiltered: res.total,
                            data: array
                        });
                    },
                    error: function(err) {
                        cogoToast.error( err.responseJSON['error'].details !== undefined ? err.responseJSON['error'].details[0].message : err.responseJSON['error'], {position: "top-right", hideAfter: 5});
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
                        return data.name;
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return data.category.name;
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return data.grade.name;
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return moment(data.createdAt).format("Do MMM, YYYY");;
                    },
                    "targets": 3
                },
                {
                    "render": function () {
                        return `<nav class="nav nav-icon-only" id="fake">
                                    <a href="#" class="nav-link delete_academic"><i class="fa fa-trash-alt"></i> Delete</a>
                                </nav>`
                    },
                    "targets": 4
                }
            ]
        });

        td_academic.on('click', '.delete_academic', function(e) {
            e.preventDefault();
            let extract_td = td_academic.row($(this).closest('tr')).data();
            $(".data-message").text(`Are you sure, you want to delete, ${capitalize(extract_td.raw.firstName)}?`);
            $('#delete-data').unbind("click").click(function(){

                $("#modalConfirm").modal("hide");
                $(".modal-backdrop").remove();

                const options = {
                    position: "top-right",
                    hideAfter: 0
                };

                let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

                let data = {
                    id: extract_td.raw._id,
                }

                academic("delete", data).then((result) => {
                    hide();
                    if(!result.error) {
                        $('#academic-table').DataTable().ajax.reload(null, false);
                        cogoToast.success("Academic successfully removed.", {position: "top-right"});
                    }
                });
            });

            $("#modalConfirm").modal({ backdrop: 'static', focus: false, show: true });
        });
    }

    const handleModalStudent = () => {
        setEditForm(false);
        initializeSearch();
        $('#password').prop("disabled", false).prop("required", true);
        $('#student_form').parsley();
        $("#modalStudent").modal({ backdrop: 'static', focus: false, show: true });
    }

    const handleModalAcademic = () => {
        setEditForm(false);
        _initializeSearch();
        $('#academic_form').parsley();
        $("#modalAcademic").modal({ backdrop: 'static', focus: false, show: true });
    }

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

    const handleSubmitStudent = (e) => {
        e.preventDefault();
        setFormLoading(true);

        let firstName = $('#firstName').val();
        let lastName = $('#lastName').val();
        let id_number = $('#id_number').val();
        let grade = $("#grade-select2").val();
        let password = $('#password').val();

        let raw = {
            firstName,
            lastName,
            id_number,
            grade,
            password,
            academia: academia._id
        }

        student("post", raw).then((result) => {
            setFormLoading(false);

            if(!result.error) {
                cogoToast.success("Data successfully created.", {position: "top-right", hideAfter: 5});
                resetForm("modalStudent", "student_form");
                reloadTable();
            }
        });
    }

    const handleSubmitAcademic = (e) => {
        e.preventDefault();
        setFormLoading(true);

        let courses = $("#course-select2").val();
        let grade = $("#single-grade-select2").val()[0];

        let raw = {
            courses,
            grade,
            academia: academia._id
        }

        academicCopyCourse("post", raw).then((result) => {
            setFormLoading(false);

            if(!result.error) {
                cogoToast.success("Data successfully created.", {position: "top-right", hideAfter: 5});
                resetForm("modalAcademic", "academic_form");
                $('#academic-table').DataTable().ajax.reload(null, false);
            }
        });
    }

    const reloadTable = () => {
        $('#student-table').DataTable().ajax.reload(null, false);
    };

    if(!loading) {
        return (
            <div className="content-body">
                <div className="container-fluid pd-x-0">
                    <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                        <div>
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                    <li className="breadcrumb-item"><a href="#">Menu</a></li>
                                    <li className="breadcrumb-item"><a href="#">Academia</a></li>
                                    <li className="breadcrumb-item active" aria-current="page">Details</li>
                                </ol>
                            </nav>
                        </div>
                    </div>

                    <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                        <div className="media">
                            <div className="wd-100 ht-100 bg-ui-04 rounded d-flex align-items-center justify-content-center bg-white">
                                <img src={academia.logo.uri} className="img-fluid rounded-5" alt="logo" />
                            </div>
                            <div className="media-body pd-l-25 my-auto">
                                <h5 className="mg-b-5">{capitalize(academia.name)}</h5>
                                <p className="mg-b-3 text-capitalize">
                                    <span className="tx-medium tx-color-02">{academia.id_number}</span><br />
                                    {academia.address}
                                </p>
                                <span className="d-block tx-13 tx-color-03">{academia.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="row row-xs">
                        <div className="col-md-12 mg-t-10">
                            <div className="nav-wrapper mg-b-20 tx-13">
                                <div>
                                    <ul id="nav_basic" className="nav nav-line nav-fill tx-medium">
                                        <li className="nav-item"><a href="#basic" className="nav-link active" data-toggle="tab"><i className="ion-md-person"/> Student</a></li>
                                        <li className="nav-item"><a href="#academic" className="nav-link" data-toggle="tab" onClick={academicDatatable.bind()}><i className="ion-md-film"/> Academic</a></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="tab-content">
                                <div id="basic" className="tab-pane fade active show">
                                    <div className="row row-sm">
                                        <div className="col-md-12">
                                            <div className="card">
                                                <div className="card-header d-flex align-items-center justify-content-between">
                                                    <h6 className="mg-b-0">Student</h6>
                                                    <div className="d-flex tx-18">
                                                        <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={() => $('#student-table').DataTable().ajax.reload()}><i className="icon ion-md-refresh"></i></a>
                                                        <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={handleModalStudent.bind()}><i className="icon ion-md-add"></i></a>
                                                    </div>
                                                </div>
                                                <div className="card-body table-responsive">
                                                    <table id="student-table" className="table table-hover" style={{width: "100%"}}>
                                                        <thead>
                                                        <tr>
                                                            <th className="wd-20p">Name</th>
                                                            <th className="wd-20p">ID Number</th>
                                                            <th className="wd-20p">Grade</th>
                                                            <th className="wd-20p">Date</th>
                                                            <th className="wd-20p">Actions</th>
                                                        </tr>
                                                        </thead>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="academic" className="tab-pane fade">
                                    <div className="row row-sm">
                                        <div className="col-md-12">
                                            <div className="card">
                                                <div className="card-header d-flex align-items-center justify-content-between">
                                                    <h6 className="mg-b-0">Academic</h6>
                                                    <div className="d-flex tx-18">
                                                        <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={() => $('#academic-table').DataTable().ajax.reload()}><i className="icon ion-md-refresh"></i></a>
                                                        <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={handleModalAcademic.bind()}><i className="icon ion-md-add"></i></a>
                                                    </div>
                                                </div>
                                                <div className="card-body table-responsive">
                                                    <table id="academic-table" className="table table-hover" style={{width: "100%"}}>
                                                        <thead>
                                                        <tr>
                                                            <th className="wd-20p">Name</th>
                                                            <th className="wd-20p">Category</th>
                                                            <th className="wd-20p">Grade</th>
                                                            <th className="wd-20p">Date</th>
                                                            <th className="wd-20p">Actions</th>
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
                    </div>

                    <div className="modal fade" id="modalStudent" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                            <div className="modal-content">
                                <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                    <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </a>
                                    <div className="media-body">
                                        <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalStudent", "student_form")} aria-label="Close">
                                            <span aria-hidden="true">×</span>
                                        </a>
                                        <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Student</h4>
                                        <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                    </div>
                                </div>
                                <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                    <form id="student_form" className="parsley-style-1" onSubmit={handleSubmitStudent.bind()}>
                                        <div id="nameWrapper" className="form-group parsley-input">
                                            <label>First Name<span className="tx-danger">*</span></label>
                                            <input id="firstName" type="text" className="form-control"
                                                   placeholder="Enter school name"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#nameWrapper" required/>
                                        </div>

                                        <div id="nameWrapper" className="form-group parsley-input">
                                            <label>Last Name<span className="tx-danger">*</span></label>
                                            <input id="lastName" type="text" className="form-control"
                                                   placeholder="Enter school name"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#nameWrapper" required/>
                                        </div>

                                        <div id="idWrapper" className="form-group parsley-input">
                                            <label>ID Number<span className="tx-danger">*</span></label>
                                            <input id="id_number" type="text" className="form-control"
                                                   placeholder="Enter id number"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#idWrapper" required/>
                                        </div>

                                        <div id="gradeWrapper" className="form-group parsley-input">
                                            <div className="d-flex justify-content-between">
                                                <label>Grade<span className="tx-danger">*</span></label>
                                            </div>
                                            <select className="form-control" id="grade-select2" data-width="100%" multiple="multiple"
                                                    data-parsley-class-handler="#gradeWrapper"
                                                    data-parsley-errors-container="#gradeWrapper"
                                                    autoComplete="off"
                                                    required>
                                            </select>
                                        </div>

                                        <div id="passwordWrapper" className="form-group parsley-input">
                                            <label>Password<span className="tx-danger">*</span></label>
                                            <input id="password" type="text" className="form-control"
                                                   placeholder="Enter Password"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#passwordWrapper" required/>
                                        </div>
                                        {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Finish</button>}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="modalAcademic" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                            <div className="modal-content">
                                <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                    <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </a>
                                    <div className="media-body">
                                        <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalAcademic", "academic_form")} aria-label="Close">
                                            <span aria-hidden="true">×</span>
                                        </a>
                                        <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Academic</h4>
                                        <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                    </div>
                                </div>
                                <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                    <form id="academic_form" className="parsley-style-1" onSubmit={handleSubmitAcademic.bind()}>
                                        <div id="courseWrapper" className="form-group parsley-input">
                                            <div className="d-flex justify-content-between">
                                                <label>Courses<span className="tx-danger">*</span></label>
                                            </div>
                                            <select className="form-control" id="course-select2" data-width="100%" multiple="multiple"
                                                    data-parsley-class-handler="#courseWrapper"
                                                    data-parsley-errors-container="#courseWrapper"
                                                    autoComplete="off"
                                                    required>
                                            </select>
                                        </div>

                                        <div id="gradeWrapper" className="form-group parsley-input">
                                            <div className="d-flex justify-content-between">
                                                <label>Grade<span className="tx-danger">*</span></label>
                                            </div>
                                            <select className="form-control" id="single-grade-select2" data-width="100%" multiple="multiple"
                                                    data-parsley-class-handler="#gradeWrapper"
                                                    data-parsley-errors-container="#gradeWrapper"
                                                    autoComplete="off"
                                                    required>
                                            </select>
                                        </div>
                                        {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Finish</button>}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="modalConfirm" tabIndex="-1" role="dialog" aria-labelledby="confirmation" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
                            <div className="modal-content tx-14">
                                <div className="modal-header">
                                    <h6 className="modal-title" id="exampleModalLabel6">Delete Confirm?</h6>
                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <p className="mg-b-0 data-message">Empty</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" id="delete-data" className="btn btn-success btn-block">Yes, Delete</button>
                                    <button type="button" className="btn btn-danger btn-block mt-0" data-dismiss="modal">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className="content-body">
            <div className="container d-flex justify-content-center ht-100p">
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mg-t-10">Collecting Data</p>
                </div>
            </div>
        </div>
    )
};

export default School;
