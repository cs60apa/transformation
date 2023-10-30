import React, {useEffect, useState, useRef, useMemo} from 'react';
import {GET_COURSE_URL} from '../../api';
import 'datatables.net';
import 'datatables.net-responsive';
import 'datatables.net-rowreorder';
import 'datatables.net-buttons';
import $ from "jquery";
import 'components-jqueryui';
import {decodeQueryParameter} from "../../utils/url";
import {actionCourse, actionVideo, course} from "../../request";
import cogoToast from "cogo-toast";
import errorHandler from "../../utils/errorHandler";
import generateId from "../../utils/generateChar";
import AWS from "aws-sdk";
import {capitalize} from "../../utils/capitalize";
import PerfectScrollbar from "perfect-scrollbar";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Editor from "quill/core/editor";

let percentage = 0;
let totalFiles = 0;

const bucket = new AWS.S3({
    accessKeyId: "hcs",
    secretAccessKey: "HCS!2022%",
    endpoint: "https://cloudinary.zstudy.co",
    signatureVersion: 'v4',
    s3ForcePathStyle: true
});

const ViewCourse = (props) => {

    document.title = "View Course";

    const quillRef = useRef();

    const token = localStorage.getItem('jwtToken');

    const course_data = decodeQueryParameter(props.match.params.course.replace(/'/g, ""));

    const [publishLoading, setPublishLoading] = useState(false);
    const [publish, setPublish] = useState(course_data.published);
    const [contentId, setContentId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [videoId, setVideoId] = useState("");
    const [uploadPercentage, setUploadPercentage] = useState("Calculating");
    const [value, setValue] = useState(null);

    useEffect(() => {
        var table = $('#lesson').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Course Lesson list</p>'
            },
            "searching": false,
            "lengthMenu": [[50], [50]],
            ordering: false,
            info: true,
            bFilter: false,
            processing: true,
            serverSide: true,
            pageLength: 50,
            rowReorder: {
                dataSrc: 'name',
                update: false,
                selector: 'td:nth-child(1)'
            },
            ajax: function(data, callback) {
                // make a regular ajax request using data.start and data.length
                $.ajax(GET_COURSE_URL(course_data._id), {
                    type: 'GET',
                    headers: {
                        "Authorization": token
                    },
                    success : function(res) {
                        let array = [];
                        res.payload.contents.map((data) => {array.push({raw: data})});
                        callback({
                            recordsTotal: res.payload.contents.length,
                            recordsFiltered: res.payload.contents.length,
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
                        return `<span class="move">${data.position}. ${data.name}</span>`;
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return data.videos.length;
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return {
                            true : `<span class="badge badge-primary tx-white">Yes</span>`,
                            false : `<span class="badge badge-danger tx-white">No</span>`
                        }[false];
                    },
                    "targets": 3
                },
                {
                    "render": function () {
                        return `<nav class="nav nav-icon-only">
                                    <a href="#" class="nav-link edit-lesson"><i class="fa fa-pencil"></i> Edit</a><a href="#" class="nav-link delete_lesson"><i class="fa fa-trash-alt"></i> Delete</a>
                                </nav>`
                    },
                    "targets": 4
                }
            ]
        });

        let _table = $('#lesson tbody');

        _table.on('click', 'td.dt-control', function () {
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

        let raw  = null;

        function format(d) {

            raw = d.raw;
            let extra = [];
            if(d.raw.simulator !== null) {extra.push({_id: 0, name: "Simulator - Interactive Learning"})}
            if(d.raw.document !== null) {extra.push({_id: 1, name: "Document - PDF"})}
            // `d` is the original data object for the row
            return `<tr><td class="tx-13 pd-0">
                        <nav class="d-flex"><span class="text-danger tx-bold">Actions:</span>
                            <a href="#" id="${d.raw._id}" class="nav-link show-video pd-t-0"><i class="fa fa-video"></i> Add video</a>
                            ${d.raw.document === null ? `<a href="#" id="${d.raw._id}" class="nav-link show-document pd-t-0 pd-l-0"><i class="fa fa-file-pdf"></i> Add Document</a>` : `<a href="#" id="${d.raw._id}" class="nav-link delete-document pd-t-0 pd-l-0"><i class="fa fa-file-pdf"></i> Delete Document</a>` } 
                            ${d.raw.simulator === null ? `<a href="#" id="${d.raw._id}" class="nav-link pd-t-0 pd-l-0 show-simulator"><i class="fa fa-play-circle"></i> Add Simulator</a>` : `<a href="#" id="${d.raw._id}" class="nav-link pd-t-0 pd-l-0 delete-simulator"><i class="fa fa-trash"></i> Delete Simulator</a>`}</nav></td></tr>
                            ${[...d.raw.videos, ...extra].map((item, index) => {
                                return (`<tr><td class="tx-13 pd-0"><nav class="d-flex">${d.raw.position}.${index+1}. ${item.name}<a href="#" id="${item._id}-${d.raw._id}" class="nav-link ${item._id === 0 ? "edit-simulator" : item._id === 1 ? "edit-document" : `edit-video`} pd-t-0"><i class="fa fa-pencil"></i> Edit</a><a href="#" id="${item._id}-${d.raw._id}" class="nav-link ${item._id === 0 ? "delete-simulator" : item._id === 1 ? "delete-document" : "delete-video"} pd-t-0 pd-l-0"><i class="fa fa-trash-alt"></i> Delete</a></nav></td></tr>`)
                            })}`;
        }

        _table.on('click', '.show-video', function (e) {
            e.preventDefault();
            setContentId(e.target.id);
            $("#modalContentVideo").modal({backdrop: 'static', keyboard: false}, "show");
        });

        _table.on('click', '.show-simulator', function (e) {
            e.preventDefault();
            setContentId(e.target.id);
            $("#modalSimulator").modal({backdrop: 'static', keyboard: false}, "show");
        });

        _table.on('click', '.show-document', function (e) {
            e.preventDefault();
            setContentId(e.target.id);
            $("#modalDocument").modal({backdrop: 'static', keyboard: false}, "show");
        });

        _table.on('click', '.edit-document', function (e) {
            e.preventDefault();
            setContentId(e.target.id);

            $("#document-name").val(raw.document.name);

            $("#file").prop("required", false);
            $("#modalDocument").modal({backdrop: 'static', keyboard: false}, "show");
        });

        _table.on('click', '.delete-document', function (e) {
            e.preventDefault();
            deleteDocument({
                action: "delete-document",
                content_id: e.target.id.split('-')[1] || e.target.id
            }, 'delete document');
        });

        _table.on('click', '.edit-simulator', function (e) {
            e.preventDefault();
            setContentId(e.target.id);

            $(".ql-editor")[0].innerHTML = atob(raw.simulator.instruction);
            $("#description").val(raw.simulator.description);

            $("#file").prop("required", false);
            $("#modalSimulator").modal({backdrop: 'static', keyboard: false}, "show");
        });

        _table.on('click', '.delete-simulator', function (e) {
            e.preventDefault();
            deleteDocument({
                action: "delete-simulator",
                content_id: e.target.id.split('-')[1] || e.target.id
            }, 'delete simulator');
        });

        _table.on('click', '.delete-video', function (e) {
            e.preventDefault();
            deleteDocument({
                action: "delete-video",
                content_id: e.target.id.split('-')[1],
                video_id: e.target.id.split('-')[0]
            }, "delete video");
        });

        _table.on('click', '.edit-video', function (e) {
            e.preventDefault();
            console.log({
                raw: raw.videos,
                _id: e.target.id.split('-')[0]
            })
            // setContentId(e.target.id.split('-')[1]);
            // console.log(raw.videos.find((item) => item._id == e.target.id.split('-')[0]));
            // console.log(e.target.id.split('-')[0])
            // $("#video-name").val(raw.videos.find((item) => item._id == e.target.id.split('-')[0]).name);
            $("#modalEditVideo").modal({backdrop: 'static', keyboard: false}, "show");
        });

        // table.on( 'row-reorder', function ( e, diff) {
        //     if(diff.length) {
        //         let rows = [];
        //         diff.forEach(element => {
        //             rows.push({
        //                 id: table.row(element.node).data().raw._id,
        //                 position: element.newPosition
        //             });
        //         });
        //
        //         let data = {
        //             "action": "reorder",
        //             "course_id": course_data._id,
        //             "videos": rows
        //         }
        //
        //         actionVideo(data).then((result) => {
        //             if(!result.error) {
        //                 const options = {
        //                     position: "top-right"
        //                 };
        //
        //                 reloadTable();
        //                 cogoToast.success("Video position successfully updated.", options);
        //                 return false;
        //             }
        //
        //             errorHandler(result.data, 'top-right');
        //         });
        //     }
        // });

        table.on('click', '.edit-lesson', function(e) {
            e.preventDefault();
            let extract_td = table.row($(this).closest('tr')).data();
            setContentId(extract_td.raw._id);

            $("#content-name").val(extract_td.raw.name);
            $("#modalLesson").modal({backdrop: 'static', keyboard: false}, "show");
        })

        table.on('click', '.delete_lesson', function(e) {
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
                    id: course_data._id,
                    data: {
                        action: "remove-content",
                        content_id: extract_td.raw._id
                    }
                }

                course("put", data).then((result) => {
                    hide();
                    if(!result.error) {
                        reloadTable();
                        cogoToast.success("Lesson successfully removed.", {position: "top-right"});
                    }
                });
            });

            $("#modalConfirm").modal({ backdrop: 'static', focus: false, show: true });
        });
    }, []);

    const reloadTable = () => {
        $('#lesson').DataTable().ajax.reload();
    };

    const handlePublish = (e) => {
        e.preventDefault();

        const options = {
            position: "top-right",
            hideAfter: 2,
        };

        if(course_data.published) {
            cogoToast.error("Course already published.", options);
            return false;
        }

        let data = {
            "id": course_data._id,
            "action": "publish"
        }

        setPublishLoading(true);
        actionCourse(data, {}).then((result) => {
            setPublishLoading(false);
            if(result.error !== true) {
                setPublish(true);
                cogoToast.success(result.data, options);
                return false;
            }

            errorHandler(result.data, 'top-right');
        });
    };

    const handleAddVideo = (e) => {
        e.preventDefault();
        $("#modalAddContent").modal({backdrop: 'static', keyboard: false}, "show");
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

    const handleAddContentSubmit = async(e) => {
        e.preventDefault();
        setFormLoading(true);
        let files = $('#video_file').prop('files');

        let promises = [];
        let ResponseData = [];

        $.each(files, async function(i, file) {
            promises.push(file);
        });

        totalFiles = promises.length;

        for(let i = 0; i < promises.length; i++){
            percentage = (100/totalFiles) * i;
            ResponseData.push(Object.assign(await S3upload(promises[i]), {name: promises[i].name, type: promises[i].type, size: promises[i].size}));
        }

        Promise.all(promises).then(function(){
            totalFiles = 0;
            percentage = 0;

            let raw = {
                id: course_data._id,
                data: {
                    action: "add-content",
                    name: $("#lesson-name").val(),
                    videos: ResponseData.reduce((result, { name, Location, type, size }, index) => result.push({name: name.split('.').slice(0, -1).join('.'), location: Location, type: type, size: size.toString()}) && result, [])
                }
            }

            course("put", raw).then((result) => {
                setFormLoading(false);
                if(!result.error) {
                    cogoToast.success("Data successfully created.", {position: "top-right", hideAfter: 5});
                    resetForm("modalAddContent", "content_form");
                    reloadTable();
                }
            });
        });
    };

    const handleContentVideoSubmit = async(e) => {
        e.preventDefault();
        setFormLoading(true);
        let files = $('#content_video_file').prop('files');

        let promises = [];
        let ResponseData = [];

        $.each(files, async function(i, file) {
            promises.push(file);
        });

        totalFiles = promises.length;

        for(let i = 0; i < promises.length; i++){
            percentage = (100/totalFiles) * i;
            ResponseData.push(Object.assign(await S3upload(promises[i]), {name: promises[i].name, type: promises[i].type, size: promises[i].size}));
        }

        Promise.all(promises).then(function(){
            totalFiles = 0;
            percentage = 0;

            let raw = {
                id: course_data._id,
                data: {
                    action: "add-video",
                    content_id: contentId,
                    videos: ResponseData.reduce((result, { name, Location, type, size }, index) => result.push({name: name.split('.').slice(0, -1).join('.'), location: Location, type: type, size: size.toString()}) && result, [])
                }
            }

            course("put", raw).then((result) => {
                setFormLoading(false);
                if(!result.error) {
                    cogoToast.success("Video successfully added.", {position: "top-right", hideAfter: 5});
                    resetForm("modalContentVideo", "content_video_form");
                    reloadTable();
                }
            });
        });
    };

    const S3upload = (file) => {
        const params = {
            Bucket: "app.zstudy",
            Key: `uploads/${generateId(50)}`,
            Body: file,
            ContentType: file.type
        };

        return bucket.upload(params, function (err, data) {
            if (err) return console.log(err);
            return data;
        }).on('httpUploadProgress', function(progress) {
            let progressPercentage = Math.round(progress.loaded / progress.total * 100);
            setUploadPercentage(`Uploading ${(percentage + progressPercentage/totalFiles).toFixed(1)}%`);
        }).promise();
    }

    const handleEditSubmit = (e) => {
        e.preventDefault();

        let data = {
            "id": videoId,
            "name": $("#name").val(),
            "download": $("#download").val(),
            "action": "update_video"
        }

        setFormLoading(true);
        actionVideo(data, {}).then((result) => {
            setFormLoading(false);

            if(result.error !== true) {
                reloadTable();
                onCloseModal( "modalEditVideo", "video_form");
                cogoToast.success(result.data, {position: "top-right", hideAfter: 2});
                return false;
            }

            errorHandler(result.data, 'top-right');
        });
    };

    const handleSimulatorSubmit = async(e) => {
        e.preventDefault();
        setFormLoading(true);

        let file = $('#html_file').prop('files')[0];

        let upload = await S3upload(file);

        let data = {
            id: course_data._id,
            data: {
                action: "add-simulator",
                content_id: contentId,
                simulator: {
                    instruction: btoa(value),
                    description: $("#description").val(),
                    file: {
                        name: file.name,
                        type: file.type,
                        size: file.size.toString(),
                        location: upload.Location
                    }
                }
            }
        }

        course("put", data).then((result) => {
            setFormLoading(false);

            if(!result.error) {
                setValue(null);
                cogoToast.success("Simulator successfully created.", {position: "top-right", hideAfter: 5});
                resetForm("modalSimulator", "simulator_form");
                reloadTable();
            }
        });
    }

    const handleDocumentSubmit = async(e) => {
        e.preventDefault();
        setFormLoading(true);

        let file = $('#document-file').prop('files')[0];

        let upload = await S3upload(file);

        let data = {
            id: course_data._id,
            data: {
                action: "add-document",
                content_id: contentId,
                document: {
                    file: {
                        name: $("#document-name").val(),
                        type: file.type,
                        size: file.size.toString(),
                        location: upload.Location
                    }
                }
            }
        }

        course("put", data).then((result) => {
            setFormLoading(false);

            if(!result.error) {
                setValue(null);
                cogoToast.success("Document successfully created.", {position: "top-right", hideAfter: 5});
                resetForm("modalDocument", "document_form");
                reloadTable();
            }
        });
    }

    const handleLessonSubmit = async(e) => {
        e.preventDefault();
        setFormLoading(true);

        let data = {
            id: course_data._id,
            data: {
                action: "edit-content",
                content_id: contentId,
                name: $("#content-name").val()
            }
        }

        course("put", data).then((result) => {
            setFormLoading(false);

            if(!result.error) {
                setValue(null);
                cogoToast.success("Document successfully created.", {position: "top-right", hideAfter: 5});
                resetForm("modalLesson", "lesson_form");
                reloadTable();
            }
        });
    }

    const deleteDocument = (data, title) => {
        $(".data-message").text(`Are you sure, you want to ${title}?`);
        $('#delete-data').unbind("click").click(function(){

            $("#modalConfirm").modal("hide");
            $(".modal-backdrop").remove();

            const options = {
                position: "top-right",
                hideAfter: 0
            };

            let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

            let _data = {
                id: course_data._id,
                data: data
            }

            course("put", _data).then((result) => {
                hide();
                if(!result.error) {
                    reloadTable();
                    cogoToast.success(`Document successfully removed.`, {position: "top-right"});
                }
            });
        });

        $("#modalConfirm").modal({ backdrop: 'static', focus: false, show: true });
    }

    const imageHandler = () => {
        const editor = quillRef.current.getEditor();
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (/^image\//.test(file.type)) {
                const res = await S3upload(file); // upload data into server or aws or cloudinary
                const url = res?.Location;
                editor.insertEmbed(editor.getSelection(), "image", url);
            } else {
                cogoToast.error('You could only upload images.', {hideAfter: 3});
            }
        }
    }

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                    [{size: []}],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{'list': 'ordered'}, {'list': 'bullet'},
                        {'indent': '-1'}, {'indent': '+1'}],
                    ['image'],
                    ['clean']
                ],

                handlers: {
                    image: imageHandler.bind(),
                },
                history: {
                    delay: 500,
                    maxStack: 100,
                    userOnly: true,
                },
            },
        }),
        []
    );

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

    return (
        <div className="content-body">
            <div className="container-fluid pd-x-0">
                <nav aria-label="breadcrumb" className="mb-4">
                    <ol className="breadcrumb breadcrumb-style1">
                        <li className="breadcrumb-item"><a href="#">General</a></li>
                        <li className="breadcrumb-item"><a href="#">Course</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Details</li>
                    </ol>
                </nav>
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div className="media">
                        <div className="wd-100 ht-100 bg-ui-04 rounded d-flex align-items-center justify-content-center">
                            <a href="#modalShowCover" data-toggle="modal" data-animation="effect-scale">
                                <img src={course_data.cover.uri} className="img-fluid img-fit-cover rounded-5"/>
                            </a>
                        </div>
                        <div className="media-body pd-l-25 my-auto">
                            <h5 className="mg-b-5">{course_data.premium ? <i className="ion ion-ios-checkmark-circle tx-primary"></i> : <i className="ion ion-ios-checkmark-circle tx-success"></i>} {course_data.name}</h5>
                            <p className="mg-b-3"><span
                                className="tx-medium tx-color-02">{course_data.name}</span><br/>{course_data.name}</p>
                            <span className="d-block tx-13 tx-color-03">{course_data.year}</span>
                        </div>
                    </div>
                    <div className="d-none d-md-block my-auto">
                        {publishLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : publish ? <button className="btn btn-sm pd-x-15 btn-success btn-uppercase mg-l-5 outline-none" onClick={handlePublish.bind()}><i className="wd-10 mg-r-5 ion ion-ios-rocket"></i> Published</button> : <button className="btn btn-sm pd-x-15 btn-outline-secondary btn-uppercase mg-l-5 outline-none" onClick={handlePublish.bind()}><i className="wd-10 mg-r-5 ion ion-ios-rocket"></i> Publish</button>}
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleAddVideo.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add Lesson</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Lesson Lists</h6>
                                <div className="d-flex tx-18">
                                    <a href="javascript:void(0)" className="link-03 lh-0" onClick={reloadTable.bind()}><i className="icon ion-md-refresh"></i></a>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="lesson" className="table">
                                    <thead className="thead-light">
                                    <tr>
                                        <th></th>
                                        <th className="wd-50p">Name</th>
                                        <th className="wd-20p"># of Content</th>
                                        <th className="wd-10p">Download</th>
                                        <th className="wd-30p">Actions</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalEditVideo" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalEditVideo", "video_form")} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Edit Video</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="video_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleEditSubmit.bind()}>
                                    <div id="nameWrapper" className="form-group parsley-input">
                                        <label>Video Name<span className="tx-danger">*</span></label>
                                        <input id="video-name" type="text" className="form-control"
                                               placeholder="Enter video name"
                                               autoComplete="off"
                                               data-parsley-class-handler="#nameWrapper" required/>
                                    </div>

                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Upload File</label>
                                        <input id="file" type="file" className="form-control"
                                               data-parsley-filemaxmegabytes="1"
                                               data-parsley-trigger="change"
                                               data-parsley-filemimetypes="video/mp4"
                                               accept="video/mp4"
                                               required
                                        />
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Update Video</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalDocument" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={() => {$("#file").prop('required', true); onCloseModal("modalDocument", "document_form")}} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="title">Document</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="document_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleDocumentSubmit.bind()}>
                                    <div id="nameWrapper" className="form-group parsley-input">
                                        <label>Document Name<span className="tx-danger">*</span></label>
                                        <input id="document-name" type="text" className="form-control"
                                               placeholder="Enter document name"
                                               autoComplete="off"
                                               data-parsley-class-handler="#nameWrapper" required/>
                                    </div>

                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Upload File</label>
                                        <input id="document-file" type="file" className="form-control"
                                               data-parsley-filemaxmegabytes="1"
                                               data-parsley-trigger="change"
                                               data-parsley-filemimetypes="document/pdf"
                                               accept="document/pdf"
                                               required
                                        />
                                    </div>

                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Submit Document</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalSimulator" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={() => {$("#file").prop('required', true); onCloseModal("modalSimulator", "simulator_form")}} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Interactive Learning</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="simulator_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleSimulatorSubmit.bind()}>
                                    <div className="mb-3">
                                        <label>Instruction<span className="tx-danger">*</span></label>
                                        <ReactQuill
                                            id={"quill-id"}
                                            theme="snow"
                                            alue={value}
                                            onChange={setValue}
                                            modules={modules}
                                            ref={quillRef}
                                            placeholder={'Write something...'}
                                        />
                                    </div>

                                    <div id="DescriptionWrapper" className="form-group parsley-input">
                                        <label>Description<span className="tx-danger">*</span></label>
                                        <textarea id="description" rows="5" className="form-control" placeholder="Provide a description" data-parsley-class-handler="#DescriptionWrapper" required></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Upload File</label>
                                        <input id="html_file" type="file" className="form-control"
                                               data-parsley-filemaxmegabytes="1"
                                               data-parsley-trigger="change"
                                               data-parsley-filemimetypes="text/html"
                                               accept="text/html"
                                               multiple
                                               required
                                        />
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Please Wait</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Submit Application</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalAddContent" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalAddContent", "content_form")} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Add Lesson</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="content_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleAddContentSubmit.bind()}>
                                    <div id="nameWrapper" className="form-group parsley-input">
                                        <label>Name<span className="tx-danger">*</span></label>
                                        <input id="lesson-name" type="text" className="form-control"
                                               placeholder="Enter name"
                                               autoComplete="off"
                                               data-parsley-class-handler="#nameWrapper" required/>
                                    </div>

                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Upload Video</label>
                                        <input id="video_file" type="file" className="form-control"
                                               data-parsley-filemaxmegabytes="1"
                                               data-parsley-trigger="change"
                                               data-parsley-filemimetypes="video/mp4"
                                               accept="video/mp4"
                                               multiple
                                               required
                                        />
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>{uploadPercentage}</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Add Lesson</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalContentVideo" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalContentVideo", "content_video_form")} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Add Video</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="content_video_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleContentVideoSubmit.bind()}>
                                    <div className="form-group">
                                        <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Upload Video</label>
                                        <input id="content_video_file" type="file" className="form-control"
                                               data-parsley-filemaxmegabytes="1"
                                               data-parsley-trigger="change"
                                               data-parsley-filemimetypes="video/mp4"
                                               accept="video/mp4"
                                               multiple
                                               required
                                        />
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>{uploadPercentage}</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-add"/> Add Lesson</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalLesson" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content">
                            <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </a>
                                <div className="media-body">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalLesson", "lesson_form")} aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                    <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Edit Content</h4>
                                    <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                                </div>
                            </div>
                            <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                <form id="lesson_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleLessonSubmit.bind()}>
                                    <div className="form-group">
                                        <div id="nameLessonWrapper" className="form-group parsley-input">
                                            <label>Name<span className="tx-danger">*</span></label>
                                            <input id="content-name" type="text" className="form-control"
                                                   placeholder="Enter name"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#nameLessonWrapper" required/>
                                        </div>
                                    </div>
                                    {formLoading ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>{uploadPercentage}</button> : <button className="btn btn-brand-02 btn-block mt-2"><i className="ion-md-checkmark"/> Update Lesson</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="modalShowCover" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                        <div className="modal-content rounded-10">
                            <img className="img-fluid rounded-5" src={`${course_data.cover}`} alt="cover-art"/>
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

export default ViewCourse;
