import React, {useEffect, useState} from 'react';
import {GET_COLLECTION_DATA} from '../../api';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import cogoToast from "cogo-toast";
import {addNewCategory, deleteCategory, getCategory} from "../../request";
import {useDispatch} from "react-redux";
import generateId from "../../utils/generateChar";
import AWS from "aws-sdk";

const bucket = new AWS.S3({
    accessKeyId: "hcs",
    secretAccessKey: "HCS!2022%",
    endpoint: "https://cloudinary.zstudy.co",
    signatureVersion: 'v4',
    s3ForcePathStyle: true
});

const Category = () => {

    document.title = "Category";

    const dispatch = useDispatch();

    const token = localStorage.getItem('jwtToken');

    const [cover_image, set_cover_image] = useState(null);
    const [formCategoryLoading, setFormCategoryLoading] = useState(false);
    const [categoryId, setCategoryId] = useState(0);
    const [editForm, setEditForm] = useState(false);

    useEffect(() => {
        let td_category = $('#td_category').DataTable({
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
                        collection: "category",
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
                        return data.cover_uri ? `<nav class="nav nav-icon-only"><a href=${data.cover_uri} target="_blank" class="nav-link"><i class="fa fa-eye"></i> View Image</a></nav>` : "Not Image";
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return {
                            true : `<span class="badge badge-success tx-white">Active</span>`,
                            false : `<span class="badge badge-danger tx-white">Inactive</span>`
                        }[data.enabled];
                    },
                    "targets": 2
                },
                {
                    "render": function () {
                        return `<nav class="nav nav-icon-only">
                                    <a href="#" class="nav-link edit_category"><i class="fa fa-pencil-alt"></i> Edit</a><a href="#" class="nav-link delete"><i class="fa fa-trash-alt"></i> Delete</a>
                                </nav>`
                    },
                    "targets": 3
                }
            ]
        });

        td_category.on('click', '.delete', function(e) {
            e.preventDefault();
            let extract_td = td_category.row($(this).closest('tr')).data();

            let {hide} = cogoToast.loading('Please wait... contacting to server.', {position: "top-right"});
            deleteCategory(extract_td.raw._id, "delete").then((response) => {
                hide();
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    $('#td_category').DataTable().ajax.reload();
                }
            });
        });

        td_category.on('click', '.edit_category', function(e) {
            e.preventDefault();
            let extract_td = td_category.row($(this).closest('tr')).data();
            setCategoryId(extract_td.raw._id);
            setEditForm(true);
            $("#categoryName").val(extract_td.raw.name);

            $("#cover_image").prop("required", false);
            $("#modalCategory").modal({backdrop: 'static', keyboard: false}, "show");
        });

    }, []);

    const handleCategorySubmit = async(e) => {
        e.preventDefault();

        setFormCategoryLoading(true);

        let raw = {
            name: $("#categoryName").val(),
            image: cover_image,
            action: "create"
        }

        if(editForm) {
            let _raw = {
                id: categoryId,
                name: $("#categoryName").val(),
                image: cover_image ? await S3upload(cover_image) : null,
                action: "update"
            }

            addNewCategory(_raw).then((response) => {
                setFormCategoryLoading(false);
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    onCloseModal("modalCategory", "category_form");
                    dispatch(getCategory());
                    $('#td_category').DataTable().ajax.reload();
                }

                return false;
            });

            return false;
        }

        addNewCategory(raw).then((response) => {
            setFormCategoryLoading(false);
            if(!response.error) {
                cogoToast.success(response.payload, {position: "top-right"});
                onCloseModal("modalCategory", "category_form");
                dispatch(getCategory());
                $('#td_category').DataTable().ajax.reload();
            }

            return false;
        });
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        setEditForm(false);
        $("#cover_image").prop("required", true);
        $('#category_form').parsley();
        $("#modalCategory").modal({backdrop: 'static', keyboard: false}, "show");
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

    return (
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Dashboard</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Category</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Category</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleAddCategory.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12 mg-t-10">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Total Category</h6>
                                <div className="d-flex tx-18">
                                    <a href="javascript:void(0)" className="link-03 lh-0" onClick={handleAddCategory.bind()}><i className="icon ion-md-add"></i></a>
                                    <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={() => $('#td_category').DataTable().ajax.reload()}><i className="icon ion-md-refresh"></i></a>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="td_category" className="table table-hover" style={{width: "100%"}}>
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-30p">Name</th>
                                        <th className="wd-20p">Cover Image</th>
                                        <th className="wd-20p">Status</th>
                                        <th className="wd-20p">Action</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="modalCategory" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                    <div className="modal-content">
                        <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                            <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </a>
                            <div className="media-body">
                                <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalCategory", "category_form")} aria-label="Close">
                                    <span aria-hidden="true">×</span>
                                </a>
                                <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Category</h4>
                                <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                            </div>
                        </div>
                        <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                            <form id="category_form" className="parsley-style-1" onSubmit={handleCategorySubmit.bind()}>
                                <div id="categoryNameWrapper" className="form-group parsley-input">
                                    <label>Name<span className="tx-danger">*</span></label>
                                    <input id="categoryName" type="text" className="form-control"
                                           placeholder="Enter category name"
                                           autoComplete="off"
                                           data-parsley-class-handler="#categoryNameWrapper" required/>
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
                                {formCategoryLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Finish</button>}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Category;
