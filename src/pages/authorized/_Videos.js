import React, {useEffect, useState} from 'react';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import 'select2';
import 'components-jqueryui';
import {actionAudio, actionVideo} from "../../request";
import {GET_DATA_LIST, SEARCH_ARTIST_URL, GET_FILE_URL} from "../../api";
import errorHandler from "../../utils/errorHandler";
import {Link} from "react-router-dom";
import cogoToast from "cogo-toast";
import formatBytes from "../../utils/format-bytes";
import {useSelector} from "react-redux";
import generateId from "../../utils/generateChar";
const AWS = require('aws-sdk');

let percentage = 0;
let totalFiles = 0;

const bucket = new AWS.S3({
    accessKeyId: process.env.REACT_APP_ACCESS_ID,
    secretAccessKey: process.env.REACT_APP_ACCESS_KEY,
    region: process.env.REACT_APP_REGION
});

const Videos = () => {

    document.title = "Videos";

    const token = localStorage.getItem('jwtToken');

    const [formLoading, setFormLoading] = useState(false);
    const [artistId, setArtistId] = useState(null);
    const [cover_image, set_cover_image] = useState(null);
    const [uploadPercentage, setUploadPercentage] = useState("Please Wait");

    const category = useSelector((state) => state.app.watch_category);

    window.Parsley.addValidator('maxFileSize', {
        validateString: function(_value, maxSize, parsleyInstance) {
            if(!window.FormData) {
                alert('You are using outdated browser. Please, upgrade your browser!');
                return true;
            }
            var files = parsleyInstance.$element[0].files;
            return files.length != 1  || files[0].size <= maxSize;
        },
        requirementType: 'integer',
        messages: {
            en: 'This file should not be larger than 2 MB'
        }
    });

    useEffect(() => {
        var table = $('#video_dt').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Video list</p>'
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
                $.ajax(GET_DATA_LIST, {
                    type: 'POST',
                    headers: {
                        "Authorization": token
                    },
                    data: {
                        query: $('.dataTables_filter input').val(),
                        collection: "Video",
                        fieldname: "name",
                        populate: "category",
                        pageSize: data.start,
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
                        return data.category.name
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return formatBytes(data.length);
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return data.date;
                    },
                    "targets": 3
                },
                {
                    "render": function (data) {
                        return `<nav class="nav nav-icon-only" id="fake">
                                    <a href="${GET_FILE_URL}/${data.uri}" target="_blank" class="nav-link"><i class="fa fa-arrow-alt-to-bottom"></i> <span>Download</span></a><a href="#" class="nav-link delete_video"><i class="fa fa-trash-alt"></i> Delete</a>
                                </nav>`
                    },
                    "targets": 4
                }
            ]
        });

        table.on('click', '.delete_video', function(e) {
            e.preventDefault();
            let extract_td = table.row($(this).closest('tr')).data();

            let data = {
                "id": extract_td.raw._id,
                "action": "delete"
            }

            let {hide} = cogoToast.loading('Please wait... contacting to server.', {position: "top-right", hideAfter: 2});
            actionVideo(data).then((result) => {
                hide();

                if(result.error !== true) {
                    reloadTable();
                    cogoToast.success(result.data, {position: "top-right", hideAfter: 2});
                    return false;
                }

                errorHandler(result.data, 'top-right');
            });
        });

    }, []);

    // const handleSubmit = async(e) => {
    //     e.preventDefault();
    //
    //     setUploadPercentage("Please Wait");
    //     setFormLoading(true);
    //
    //     let [files] = $('#video').prop('files');
    //
    //     const formData = new FormData();
    //
    //     formData.append('video', files);
    //     formData.append('name', $("#name").val());
    //     formData.append('category', $("#category").val());
    //     formData.append('action', 'create');
    //     formData.append('cover', cover_image);
    //
    //     const config = {
    //         headers: {
    //             'content-type': 'multipart/form-data'
    //         },
    //         encType: "multipart/form-data"
    //     };
    //
    //     actionVideo(formData, config).then((result) => {
    //         setFormLoading(false);
    //         if(result.error !== true) {
    //             onCloseModal("modalVideo", "video_form");
    //             reloadTable();
    //             return false;
    //         }
    //
    //         errorHandler(result.data, 'top-right');
    //     });
    // };

    const handleSubmit = async(e) => {
        e.preventDefault();

        setUploadPercentage("Please Wait");
        setFormLoading(true);

        let [files] = $('#video').prop('files');

        let promises = [];
        var ResponseData = [];

        promises.push(files);
        promises.push(cover_image);

        console.log(promises);

        totalFiles = promises.length;

        for(let i = 0; i < promises.length; i++){
            percentage = (100/totalFiles) * i;
            ResponseData.push(Object.assign(await S3upload(promises[i]), {name: promises[i].name, type: promises[i].type, size: promises[i].size}));
        }

        Promise.all(promises).then(function(){
            totalFiles = 0;
            percentage = 0;

            let raw = {
                action: "create",
                description: $('#description').val(),
                name: $('#name').val(),
                category: $('#category').val(),
                files: ResponseData
            }

            actionVideo(raw).then((result) => {
                setFormLoading(false);
                if(result.error !== true) {
                    setUploadPercentage("Please Wait");
                    onCloseModal("modalVideo", "video_form");
                    reloadTable();
                    return false;
                }

                errorHandler(result.data, 'top-right');
            });
        });
    }

    const S3upload = (file) =>{
        const params = {
            Bucket: process.env.REACT_APP_BUCKET_NAME,
            Key: generateId(50),
            Body: file,
            ContentType: file.type,
            ACL:'public-read'
        };

        return bucket.upload(params, function (err, data) {
            if (err) return console.log(err);
            return data;
        }).on('httpUploadProgress', function(progress) {
            let progressPercentage = Math.round(progress.loaded / progress.total * 100);
            setUploadPercentage(`Uploading ${(percentage + progressPercentage/totalFiles).toFixed(1)}%`);
        }).promise();
    }

    const handleShowModal = () => {
        $('.artist-select2').select2({
            placeholder: 'Search artist name',
            allowClear: true,
            minimumInputLength: 2,
            maximumSelectionLength: 1,
            dropdownParent: $('#modalVideo'),
            ajax: {
                url: SEARCH_ARTIST_URL,
                dataType: 'json',
                type: "POST",
                headers: {
                    "Authorization" : token,
                },
                data: function (query) {
                    return {
                        query: query
                    };
                },
                processResults: function (data) {
                    return {
                        results: $.map(data, function (item) {
                            setArtistId(item._id);
                            return {
                                text: item.name,
                                id: item
                            }
                        })
                    };
                }
            }
        });
        $("#video_form").parsley();
        $("#modalVideo").modal({backdrop: 'static', keyboard: false}, "show");
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
        $('#video_dt').DataTable().ajax.reload();
    };

    return(
        <div className="content-body">
            <div className="container pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">Music</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Videos</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Videos</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleShowModal.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Videos List</h6>
                                <div className="d-flex tx-18">
                                    <Link to="#" onClick={reloadTable.bind()} className="link-03 lh-0"><i className="icon ion-md-refresh"></i></Link>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="video_dt" className="table table-hover">
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-20p">Name</th>
                                        <th className="wd-20p">Category</th>
                                        <th className="wd-20p">Size</th>
                                        <th className="wd-20p">Release</th>
                                        <th className="wd-20p">Actions</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalVideo" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalVideo", "video_form")} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">New Video</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="video_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleSubmit.bind()}>
                                    <div id="nameWrapper" className="form-group parsley-input">
                                        <label>Title<span className="tx-danger">*</span></label>
                                        <input id="name" type="text" className="form-control"
                                               placeholder="Enter title name"
                                               autoComplete="off"
                                               data-parsley-class-handler="#nameWrapper" required/>
                                    </div>

                                    <div id="genreWrapper" className="form-group parsley-input">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Category<span className="tx-danger">*</span></label>
                                        <select className="custom-select" id="category" required>
                                            <option value="" disabled selected>Select</option>
                                            {category.map((result) => <option key={result.key} value={result.key}>{result.title}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Video Cover</label>
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

                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Upload Video</label>
                                        <input id="video" type="file" className="form-control"
                                               data-parsley-filemaxmegabytes="1"
                                               data-parsley-trigger="change"
                                               data-parsley-filemimetypes="video/mp4"
                                               accept="video/mp4"
                                               required
                                        />
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>{uploadPercentage}</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Add Video</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Videos;
