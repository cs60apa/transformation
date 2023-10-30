import React, {useEffect, useState} from 'react';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import 'select2';
import 'components-jqueryui';
import {course, getCategory} from "../../request";
import {GET_COLLECTION_DATA, SEARCH_COLLECTION_URL} from "../../api";
import {useDispatch, useSelector} from "react-redux";
import {Link} from "react-router-dom";
import cogoToast from "cogo-toast";
import {encodeQueryParameter} from "../../utils/url";
import generateId from "../../utils/generateChar";
import moment from "moment/moment";
import {capitalize} from "../../utils/capitalize";
const AWS = require('aws-sdk');

const bucket = new AWS.S3({
    accessKeyId: "hcs",
    secretAccessKey: "HCS!2022%",
    endpoint: "https://cloudinary.zstudy.co",
    signatureVersion: 'v4',
    s3ForcePathStyle: true
});

const Courses = () => {

    document.title = "Courses";

    const dispatch = useDispatch();

    const category = useSelector((state) => state.app.category);
    const token = localStorage.getItem('jwtToken');

    const [formLoading, setFormLoading] = useState(false);
    const [cover_image, set_cover_image] = useState(null);
    const [courseId, setCourseId] = useState(null);
    const [__document, set_document] = useState(null);
    const [editForm, setEditForm] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [uploadPercentage, setUploadPercentage] = useState("Please Wait");

    useEffect(() => {
        dispatch(getCategory());
        let table = $('#td-course').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Courses list</p>'
            },
            "searching": true,
            "lengthMenu": [[10], [10]],
            ordering: false,
            info: true,
            bFilter: false,
            processing: true,
            pageLength: 10,
            serverSide: true,
            ajax: function (data, callback) {
                // make a regular ajax request using data.start and data.length
                $.ajax(GET_COLLECTION_DATA, {
                    type: 'POST',
                    headers: {
                        "Authorization": token
                    },
                    data: {
                        query: $('.dataTables_filter input').val(),
                        collection: "course",
                        fieldname: "email",
                        pageSize: data.start,
                        populate: "category packages cover",
                        format: 'json',
                        pageIndex: (data.length + data.start) / data.length
                    },
                    success: function (res) {
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
                        return {
                            true : `<span class="badge badge-success tx-white">Published</span>`,
                            false : `<span class="badge badge-danger tx-white">Unpublished</span>`
                        }[data.published];
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
                    "render": function (data) {
                        return `<nav class="nav nav-icon-only" id="fake">
                                    <a href="#/view-course/${encodeQueryParameter(data)}" class="nav-link view_course"><i class="fa fa-eye"></i> View</a><a href="#" class="nav-link edit_course"><i class="fa fa-pencil-alt"></i> Edit</a><a href="#" class="nav-link delete_course"><i class="fa fa-trash-alt"></i> Delete</a>
                                </nav>`
                    },
                    "targets": 4
                }
            ]
        });

        table.on('click', '.edit_course', function(e) {
            e.preventDefault();
            let extract_td = table.row($(this).closest('tr')).data();

            let subscription_select = $("#subscription");
            setCourseId(extract_td.raw._id);
            setSubscription(extract_td.raw.packages);

            $('#name').val(extract_td.raw.name);
            $('#category').val(extract_td.raw.category._id);
            $('#description').val(extract_td.raw.description);

            $('#button-action').text("Edit Course");
            $('#title').text("Edit Course");
            $('#subscription').val(extract_td.raw.packages);

            let $option = [];

            extract_td.raw.packages.map((item) => {
                $option.push($("<option selected></option>").val(item._id).text(item.title))
            })

            subscription_select.append($option).trigger('change');

            $("#cover_image").prop("required", false);

            setEditForm(true);

            $("#course_form").parsley();
            initialSelect2();
            $("#modalCourse").modal({backdrop: 'static', keyboard: false}, "show");
        });

        table.on('click', '.delete_course', function(e) {
            e.preventDefault();
            let extract_td = table.row($(this).closest('tr')).data();
            $(".data-message").text(`Are you sure, you want to delete, ${capitalize(extract_td.raw.name)}?`);
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

                course("delete", data).then((result) => {
                    hide();
                    if(!result.error) {
                        reloadTable();
                        cogoToast.success("Course successfully removed.", {position: "top-right"});
                    }
                });
            });

            $("#modalConfirm").modal({ backdrop: 'static', focus: false, show: true });
        });
    }, []);

    const initialSelect2 = () => {
        $('.subscription-select2').select2({
            placeholder: 'Select Subscription',
            allowClear: true,
            maximumSelectionLength: 5,
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
                        collection: "package"
                    };
                },
                processResults: function (data) {
                    return {
                        results: $.map(data, function (item) {
                            return {
                                text: capitalize(item.title),
                                id: item._id
                            }
                        })
                    };
                }
            }
        })
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        setFormLoading(true);

        let name = $('#name').val();
        let description = $('#description').val();
        let category = $('#category').val();
        let packages = $('.subscription-select2').val();

        if(editForm) {
            let raw = {
                id: courseId,
                name,
                description,
                category,
                packages
            }

            course("patch", raw).then((result) => {
                setFormLoading(false);

                if(!result.error) {
                    cogoToast.success("Data successfully updated.", {position: "top-right", hideAfter: 5});
                    resetForm("modalCourse", "course_form");
                    reloadTable();
                }
            });

            return false;
        }

        let file = $('#cover_image').prop('files')[0];

        let upload = await S3upload(cover_image);

        let raw = {
            name,
            description,
            category,
            packages,
            cover: {
                name: file.name,
                type: file.type,
                size: file.size.toString(),
                location: upload.Location
            }
        }

        course("post", raw).then((result) => {
            setFormLoading(false);

            if(!result.error) {
                cogoToast.success("Data successfully created.", {position: "top-right", hideAfter: 5});
                resetForm("modalCourse", "course_form");
                reloadTable();
            }
        });
    }

    const S3upload = (file) => {
        const params = {
            Bucket: "app.zstudy",
            Key: `uploads/${generateId(50)}`,
            Body: file,
            ContentType: file.type
        };

        return bucket.upload(params, function (err, data) {
            if (err) return console.log({ err });
            return data;
        }).promise();
    }

    const handleShowModal = () => {
        setEditForm(false);
        $('#title').text("New Course");
        $('#button-action').text("Add Course");
        $("#cover_image").prop("required", true);
        $("#course_form").parsley();
        initialSelect2();
        $("#modalCourse").modal({backdrop: 'static', keyboard: false}, "show");
    };

    const onCloseModal = (id, form) => {
        $(':input',`#${form}`)
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
        $(`#${id}`).modal("hide");
        $(".subscription-select2").empty().select2({
            placeholder: "Select or Type to search"
        });
        set_cover_image(null);
        $(`#${form}`).parsley().reset();
        $(".modal-backdrop").remove();
    };

    const handleFileUpload = (event) => {
        if(event.target.files[0] !== undefined && $('#cover_image').parsley().isValid() !== false) {
            let file = event.target.files[0];
            let image = new Image();
            image.src = window.URL.createObjectURL(file);
            image.onload = function() {
                set_cover_image(file);
            };
        }
    };

    const reloadTable = () => {
        $('#td-course').DataTable().ajax.reload(null, false);
    };

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

    return(
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Courses</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Overview</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Courses</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleShowModal.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Courses List</h6>
                                <div className="d-flex tx-18">
                                    <Link to="#" onClick={reloadTable.bind()} className="link-03 lh-0"><i className="icon ion-md-refresh"></i></Link>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="td-course" className="table table-hover">
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-20p">Name</th>
                                        <th className="wd-20p">Category</th>
                                        <th className="wd-20p">Total Lessons</th>
                                        <th className="wd-20p">Date</th>
                                        <th className="wd-20p">Actions</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalCourse" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalCourse", "course_form")} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="title">New Course</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="course_form" className="parsley-style-1" onSubmit={handleSubmit.bind()}>
                                    <div id="listenWrapper" className="form-group parsley-input">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Category<span className="tx-danger">*</span></label>
                                        <select className="custom-select" id="category" required>
                                            <option value="" disabled selected>Select</option>
                                            {category.map((result) => <option key={result.key} value={result.key}>{result.title}</option>)}
                                        </select>
                                    </div>

                                    <div id="nameWrapper" className="form-group parsley-input">
                                        <label>Title<span className="tx-danger">*</span></label>
                                        <input id="name" type="text" className="form-control"
                                               placeholder="Enter name"
                                               autoComplete="off"
                                               data-parsley-class-handler="#nameWrapper" required/>
                                    </div>

                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Cover Image</label>
                                        <input id="cover_image" type="file" className="form-control"
                                               onChange={handleFileUpload.bind()}
                                               data-parsley-filemaxmegabytes="1"
                                               data-parsley-trigger="change"
                                               data-parsley-filemimetypes="image/jpeg, image/jpg"
                                               data-parsley-max-file-size="2048576"
                                               accept="image/jpeg, image/jpg"
                                               required
                                        />
                                    </div>

                                    <div id="descriptionWrapper" className="form-group parsley-input">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Description</label>
                                        <textarea id="description" rows="5" className="form-control"
                                                  placeholder="Provide a description"
                                                  data-parsley-class-handler="#descriptionWrapper" required/>
                                    </div>

                                    <div id="subscriptionWrapper" className="form-group parsley-input">
                                        <label>Select Subscription<span className="tx-danger">*</span></label>
                                        <select className="form-control wd-438 subscription-select2" multiple="multiple"
                                                data-parsley-class-handler="#subscriptionWrapper"
                                                data-parsley-errors-container="#subscriptionWrapper"
                                                id="subscription"
                                                required>
                                        </select>
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>{uploadPercentage}</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> <span id="button-action">Add Video</span></button>}
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
};

export default Courses;
