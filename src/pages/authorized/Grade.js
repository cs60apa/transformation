import React, {useEffect, useState} from 'react';
import {GET_COLLECTION_DATA} from '../../api';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import cogoToast from "cogo-toast";
import {academia, grade} from "../../request";
import generateId from "../../utils/generateChar";
import AWS from "aws-sdk";
import {capitalize} from "../../utils/capitalize";

const bucket = new AWS.S3({
    accessKeyId: "hcs",
    secretAccessKey: "HCS!2022%",
    endpoint: "https://cloudinary.zstudy.co",
    signatureVersion: 'v4',
    s3ForcePathStyle: true
});

const Grade = () => {

    document.title = "Grade";

    const token = localStorage.getItem('jwtToken');
    const [gradeId, setGradeId] = useState(0);
    const [formLoading, setFormLoading] = useState(false);
    const [cover_image, set_cover_image] = useState(null);
    const [editForm, setEditForm] = useState(false);

    useEffect(() => {
        let td_grade = $('#td-academia').DataTable({
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
                        collection: "grades",
                        fieldname: "name",
                        pageSize: data.start,
                        format: 'json',
                        populate: 'cover',
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
                        return data.name;
                    },
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return data.cover.uri ? `<nav class="nav nav-icon-only"><a href=${data.cover.uri} target="_blank" class="nav-link"><i class="fa fa-eye"></i> View Image</a></nav>` : "Not Image";
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return data.section
                    },
                    "targets": 2
                },
                {
                    "render": function () {
                        return `<nav class="nav nav-icon-only">
                                    <a href="#" class="nav-link edit_grade"><i class="fa fa-pencil-alt"></i> Edit</a><a href="#" class="nav-link delete_grade"><i class="fa fa-trash-alt"></i> Delete</a>
                                </nav>`
                    },
                    "targets": 3
                }
            ]
        });

        td_grade.on('click', '.delete_grade', function(e) {
            e.preventDefault();
            let extract_td = td_grade.row($(this).closest('tr')).data();
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

                grade("delete", data).then((result) => {
                    hide();
                    if(!result.error) {
                        reloadTable();
                        cogoToast.success("Grade successfully removed.", {position: "top-right"});
                    }
                });
            });

            $("#modalConfirm").modal({ backdrop: 'static', focus: false, show: true });
        });

        td_grade.on('click', '.edit_grade', function(e) {
            e.preventDefault();
            let extract_td = td_grade.row($(this).closest('tr')).data();
            setGradeId(extract_td.raw._id);
            setEditForm(true);
            $("#name").val(extract_td.raw.name);
            $("#section").val(extract_td.raw.section);

            $("#cover_image").prop("required", false);
            $("#modalGrade").modal({backdrop: 'static', keyboard: false}, "show");
        });
    }, []);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setFormLoading(true);

        let name = $('#name').val();
        let section = $('#section').val();

        if(editForm) {
            let raw = {
                id: gradeId,
                name,
                section
            }

            grade("put", raw).then((result) => {
                setFormLoading(false);

                if(!result.error) {
                    cogoToast.success("Data successfully updated.", {position: "top-right", hideAfter: 5});
                    resetForm("modalGrade", "grade_form");
                    reloadTable();
                }
            });

            return false;
        }

        let file = $('#cover_image').prop('files')[0];

        let upload = await S3upload(cover_image);

        let raw = {
            name,
            section,
            cover: {
                name: file.name,
                type: file.type,
                size: file.size.toString(),
                location: upload.Location
            }
        }

        grade("post", raw).then((result) => {
            setFormLoading(false);

            if(!result.error) {
                cogoToast.success("Data successfully created.", {position: "top-right", hideAfter: 5});
                resetForm("modalGrade", "grade_form");
                reloadTable();
            }
        });
    }

    const handleGradeForm = (e) => {
        e.preventDefault();
        setEditForm(false);
        $("#cover_image").prop("required", true);
        $('#grade_form').parsley();
        $("#modalGrade").modal({backdrop: 'static', keyboard: false}, "show");
    }

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

    const reloadTable = () => {
        $('#td-academia').DataTable().ajax.reload(null, false);
    };

    return (
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Grade</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Grade</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleGradeForm.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12 mg-t-10">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Total Grades</h6>
                                <div className="d-flex tx-18">
                                    <a href="javascript:void(0)" className="link-03 lh-0" onClick={handleGradeForm.bind()}><i className="icon ion-md-add"></i></a>
                                    <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={() => $('#td-academia').DataTable().ajax.reload()}><i className="icon ion-md-refresh"></i></a>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="td-academia" className="table table-hover" style={{width: "100%"}}>
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-30p">Name</th>
                                        <th className="wd-20p">Image</th>
                                        <th className="wd-20p">Section</th>
                                        <th className="wd-20p">Action</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="modalGrade" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                    <div className="modal-content">
                        <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                            <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </a>
                            <div className="media-body">
                                <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalGrade", "grade_form")} aria-label="Close">
                                    <span aria-hidden="true">×</span>
                                </a>
                                <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Grade</h4>
                                <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                            </div>
                        </div>
                        <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                            <form id="grade_form" className="parsley-style-1" onSubmit={handleSubmit.bind()}>
                                <div id="nameWrapper" className="form-group parsley-input">
                                    <label>Name<span className="tx-danger">*</span></label>
                                    <input id="name" type="text" className="form-control"
                                           placeholder="Enter school name"
                                           autoComplete="off"
                                           data-parsley-class-handler="#nameWrapper" required/>
                                </div>

                                <div id="sectionWrapper" className="form-group parsley-input">
                                    <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Section<span className="tx-danger">*</span></label>
                                    <select className="custom-select" id="section" required>
                                        <option value="" disabled selected>Select</option>
                                        <option value="primary">Primary</option>
                                        <option value="secondary">Secondary</option>
                                    </select>
                                </div>

                                <div className="form-group parsley-input">
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
    )
};

export default Grade;
