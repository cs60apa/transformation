import React, {useEffect, useState} from 'react';
import {GET_DATA_LIST, GET_FILE_URL} from '../../api';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import 'components-jqueryui';
import {Link} from "react-router-dom";
import cogoToast from "cogo-toast";
import {actionArtist} from "../../request";
import {capitalize} from "../../utils/capitalize";
import countries from "../../data/countries.json";
import {useSelector} from "react-redux";
import errorHandler from "../../utils/errorHandler";
import transcode from "../../utils/transconder";
import generateId from "../../utils/generateChar";
import {createFFmpeg} from "@ffmpeg/ffmpeg";

const Artists = () => {

    document.title = "Artists";

    const [stateReady, setStateReady] = useState(false);
    const [editForm, setEditForm] = useState(false);
    const [artistId, setArtistId] = useState("");

    const ffmpeg = createFFmpeg({
        corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
    });

    const {genre} = useSelector((state) => state.app.genre);

    const token = localStorage.getItem('jwtToken');

    $(function () {
        $('#dob').datepicker({
            showOtherMonths: true,
            selectOtherMonths: true,
            minDate: '-120Y',
            maxDate: '-16Y',
            yearRange: "1800:+nn",
            changeMonth: true,
            changeYear: true,
            defaultDate: '+1w',
            numberOfMonths: 1,
            dateFormat: 'dd/mm/yy'
        });
    });

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

        // const createdCell = function(cell) {
        //     let original;
        //     cell.setAttribute('contenteditable', true)
        //     cell.setAttribute('spellcheck', false)
        //     cell.addEventListener("focus", function(e) {
        //         original = e.target.textContent
        //     })
        //     cell.addEventListener("blur", function(e) {
        //         if (original !== e.target.textContent) {
        //             const row = table.row(e.target.parentElement)
        //             row.invalidate()
        //             console.log(row);
        //             // console.log('Row changed: ', row.data())
        //         }
        //     })
        // }

        var table = $('#artists').DataTable({
            responsive: true,
            "language": {
                "processing": '<div class="spinner-border"></div><p class="mg-t-10 tx-12">Collecting Artists list</p>'
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
                $.ajax(GET_DATA_LIST, {
                    type: 'POST',
                    headers: {
                        "Authorization": token
                    },
                    data: {
                        query: $('.dataTables_filter input').val(),
                        collection: "Artist",
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
                        return data.name;
                    },
                    "targets": 0
                    // createdCell: createdCell
                },
                {
                    "render": function (data) {
                        return data.account.email
                    },
                    "targets": 1
                },
                {
                    "render": function (data) {
                        return data.account.last_login
                    },
                    "targets": 2
                },
                {
                    "render": function (data) {
                        return data.date
                    },
                    "targets": 3
                },
                {
                    "render": function () {
                        return `<nav class="nav nav-icon-only">
                                    <a href="#" class="nav-link edit_artist"><i class="fa fa-pencil"></i> Edit</a><a href="#" class="nav-link view_artist"><i class="fa fa-eye"></i> View</a>
                                </nav>`
                    },
                    "targets": 4
                }
            ]
        });

        $('#artists').on('click', '.view_artist', function () {
            $("#modalArtistInfo").modal("show");

            let extract_td = table.row($(this).closest('tr')).data();
            $('#cover_image').attr('src', `${GET_FILE_URL}/${extract_td.raw.photo.uri}`);

            $("#tx_genre").text(genre.find((data) => {return data._id === extract_td.raw.genre}).name);
            $("#tx_name").text(extract_td.raw.name);
            $("#tx_email").text(extract_td.raw.account.email);
            $("#tx_country").text(extract_td.raw.country);
            $("#tx_last_login").text(extract_td.raw.account.last_login);
            $("#tx_dob").text(extract_td.raw.dob);
            $("#tx_date").text(extract_td.raw.date);

            return false;
        });

        $('#artists').on('click', '.edit_artist', function() {
            setEditForm(true);
            let extract_td = table.row($(this).closest('tr')).data();
            $("#name").val(extract_td.raw.name);
            $("#genre").val(extract_td.raw.genre);
            $("#dob").val(extract_td.raw.dob);
            $("#email").val(extract_td.raw.account.email);
            $("#country").val(extract_td.raw.country);

            setArtistId(extract_td.raw._id);

            $("#image").prop("required", false);
            $("#password").prop("required", false);

            $("#modalArtist").modal({backdrop: 'static', keyboard: false}, "show");

            return false;
        });

        $('#artists').on('click', '.delete_artist', function() {
            let extract_td = table.row($(this).closest('tr')).data();
            const formData = new FormData();

            formData.append('id', extract_td.raw._id);
            formData.append('action', "delete");

            const config = {
                headers: {
                    'content-type': 'multipart/form-data'
                },
                encType: "multipart/form-data"
            };

            const options = {
                position: "top-right",
                hideAfter: 0
            };
            actionArtist(formData, config).then((result) => {
                hide();
                const _options = {
                    position: "top-right"
                };

                if(!result.error) {
                    reloadTable();
                    return cogoToast.success(result.data, _options);
                }

                errorHandler(result.data, 'top-right');
            });

            return false;
            let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

            actionArtist(formData, config).then((result) => {
                hide();
                const _options = {
                    position: "top-right"
                };

                if(!result.error) {
                    reloadTable();
                    return cogoToast.success(result.data, _options);
                }

                errorHandler(result.data, 'top-right');
            });

            return false;
        });

    }, []);

    const handleArtistSubmit = async(e) => {
        e.preventDefault();

        setStateReady(true);

        let [files] = $('#image').prop('files');

        await ffmpeg.load();
        let transcodeFile = await transcode(ffmpeg, files, generateId(10), "image");

        const formData = new FormData();

        formData.append('name', $('#name').val());
        formData.append('email', $('#email').val());
        formData.append('file', transcodeFile);
        formData.append('dob', $('#dob').val());
        formData.append('password', $('#password').val())
        formData.append('genre', $('#genre').val());
        formData.append('country', $('#country').val());

        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            },
            encType: "multipart/form-data"
        };

        if(editForm) {
            formData.append('action', 'update');
            formData.append('id', artistId);
            actionArtist(formData, config).then((result) => {
                setStateReady(false);
                if(result.error !== true) {
                    destroyForm( "artist_form");
                    $("#modalArtist").modal("hide");
                    $(".modal-backdrop").remove();
                    reloadTable();
                    return false;
                }

                errorHandler(result.data, 'top-right');
            });

            return false;
        }

        formData.append('action', 'create');

        actionArtist(formData, config).then((result) => {
            setStateReady(false);
            if(result.error !== true) {
                destroyForm( "artist_form");
                $("#modalArtist").modal("hide");
                $(".modal-backdrop").remove();
                reloadTable();
                return false;
            }

            errorHandler(result.data, 'top-right');
        });
    };

    const handleResetForm = () => {
        destroyForm( "artist_form");
    };

    const destroyForm = (form) => {
        const id = $(`#${form}`);
        $(':input', id)
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
        id.parsley().reset();
        id.parsley().destroy();
    };

    const handleShowModal = () => {
        setEditForm(false);
        $("#image").prop("required", true);
        $("#password").prop("required", true);
        $('#artist_form').parsley();
        $("#modalArtist").modal({backdrop: 'static', keyboard: false}, "show");
    };

    const reloadTable = () => {
        $('#artists').DataTable().ajax.reload();
    };

    return (
        <div className="content-body">
            <div className="container pd-x-0">
                <div className="d-sm-flex align-items-center justify-content-between mg-b-20 mg-lg-b-25 mg-xl-b-30">
                    <div>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-style1 mg-b-10">
                                <li className="breadcrumb-item"><a href="#">General</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Artists</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Artists</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleShowModal.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Artists List</h6>
                                <div className="d-flex tx-18">
                                    <Link to="#" onClick={reloadTable.bind()} className="link-03 lh-0"><i className="icon ion-md-refresh"></i></Link>
                                </div>
                            </div>
                            <div className="card-body table-responsive tx-success">
                                <table id="artists" className="table table-hover">
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-20p">Name</th>
                                        <th className="wd-20p">Email</th>
                                        <th className="wd-20p">Last Login</th>
                                        <th className="wd-20p">Date</th>
                                        <th className="wd-20p">Actions</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="modalArtist" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                            <div className="modal-content">
                                <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                                    <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </a>
                                    <div className="media-body">
                                        <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={handleResetForm.bind()} aria-label="Close">
                                            <span aria-hidden="true">×</span>
                                        </a>
                                        <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">{editForm ? "Edit Artist" : "Add New"}</h4>
                                        <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">{editForm ? "Edit artist information" : "Add new artist"}</p>
                                    </div>
                                </div>
                                <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                                    <form id="artist_form" className="parsley-style-1" data-parsley-validate="true" noValidate onSubmit={handleArtistSubmit.bind()}>
                                        <div id="genreWrapper" className="form-group parsley-input">
                                            <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Genre<span className="tx-danger">*</span></label>
                                            <select className="custom-select"
                                                    id="genre"
                                                    required>
                                                <option value="" disabled selected>Select</option>
                                                {genre.map((result) => <option key={result._id} value={result._id}>{capitalize(result.name)}</option>)}
                                            </select>
                                        </div>

                                        <div id="nameWrapper" className="form-group parsley-input">
                                            <label>Name<span className="tx-danger">*</span></label>
                                            <input id="name" type="text" className="form-control"
                                                   placeholder="Enter name"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#nameWrapper" required/>
                                        </div>

                                        <div id="dateWrapper" className="form-group parsley-input">
                                            <label>Date of Birth<span className="tx-danger">*</span></label>
                                            <input type="text"
                                                   id="dob"
                                                   className="form-control"
                                                   placeholder="Select date"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#dateWrapper"
                                                   required
                                                   readOnly
                                            />
                                        </div>

                                        <div id="countryWrapper" className="form-group parsley-input">
                                            <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Country<span className="tx-danger">*</span></label>
                                            <select className="custom-select"
                                                    id="country"
                                                    required>
                                                <option value="" disabled selected>Select</option>
                                                {countries.map((result) => <option key={result._id} value={result._id}>{capitalize(result.name)}</option>)}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Cover Images<span className="tx-danger">*</span></label>
                                            <input id="image" type="file" className="form-control"
                                                   data-parsley-filemaxmegabytes="1"
                                                   data-parsley-trigger="change"
                                                   data-parsley-filemimetypes="image/jpeg, image/jpg"
                                                   data-parsley-max-file-size="2048576"
                                                   accept="image/jpeg, image/jpg"
                                            />
                                        </div>

                                        <div id="emailWrapper" className="form-group parsley-input">
                                            <label>Email<span className="tx-danger">*</span></label>
                                            <input id="email" type="email" className="form-control"
                                                   placeholder="Enter email address"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#emailWrapper" required/>
                                        </div>

                                        <div id="passwordWrapper" className="form-group parsley-input">
                                            <label>Password<span className="tx-danger">*</span></label>
                                            <input id="password" type="text" className="form-control"
                                                   placeholder="Enter password"
                                                   autoComplete="off"
                                                   data-parsley-class-handler="#passwordWrapper"/>
                                        </div>

                                        {stateReady ? <button disabled className="btn btn-brand-02 btn-block"><span className="spinner-border spinner-border-sm mg-r-10" role="status" aria-hidden="true"/>Creating Profile</button> : editForm ? <button className="btn btn-brand-02 btn-block">Update Artist</button> : <button className="btn btn-brand-02 btn-block">Add Artist</button>}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="modalArtistInfo" tabIndex="-1" role="dialog" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered mx-wd-sm-650" role="document">
                            <div className="modal-content bd-0 bg-transparent">
                                <div className="modal-body pd-0">
                                    <a href="" role="button" className="close pos-absolute t-15 r-15 z-index-10"
                                       data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </a>

                                    <div className="row no-gutters">
                                        <div className="col-3 col-sm-5 col-md-6 col-lg-5 bg-primary rounded-left">
                                            <div className="wd-100p ht-100p">
                                                <img id="cover_image" src="https://via.placeholder.com/286x429" className="wd-100p img-fit-cover img-object-top rounded-left" alt=""/>
                                            </div>
                                        </div>
                                        <div className="col-9 col-sm-7 col-md-6 col-lg-7 bg-white rounded-right">
                                            <div
                                                className="ht-100p d-flex flex-column justify-content-center pd-20 pd-sm-30 pd-md-40">
                                                <span className="tx-color-04"><i data-feather="headphones" className="wd-40 ht-40 stroke-wd-3 mg-b-20"></i></span>
                                                <h3 id="tx_name" className="tx-16 tx-color-03 tx-sm-20 tx-md-24 mg-b-15 mg-md-b-20">Not Set</h3>
                                                <p className="tx-12 tx-md-13 tx-color-02"><strong>Genre:</strong> <span id="tx_genre">Not Set</span></p>
                                                <p className="tx-12 tx-md-13 tx-color-02"><strong>Email:</strong> <span id="tx_email">Not Set</span></p>
                                                <p className="tx-12 tx-md-13 tx-color-02"><strong>Country:</strong> <span id="tx_country">Not Set</span></p>
                                                <p className="tx-12 tx-md-13 tx-color-02"><strong>Date of Birth:</strong> <span id="tx_dob">Not Set</span></p>
                                                <p className="tx-12 tx-md-13 tx-color-02"><strong>Last Login:</strong> <span id="tx_last_login">Not Set</span></p>
                                                <p className="tx-12 tx-md-13 tx-color-02"><strong>Date Added:</strong> <span id="tx_date">Not Set</span></p>
                                                <a href="" className="btn btn-primary btn-block btn-uppercase mg-t-20">View Album/Track</a>
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

export default Artists;
