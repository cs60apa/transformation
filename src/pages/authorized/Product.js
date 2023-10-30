import React, {useEffect, useState} from 'react';
import {GET_COLLECTION_DATA} from '../../api';
import 'datatables.net';
import 'datatables.net-responsive';
import $ from "jquery";
import cogoToast from "cogo-toast";
import {addNewProduct, deleteProduct} from "../../request";
import generateId from "../../utils/generateChar";
import AWS from "aws-sdk";

const bucket = new AWS.S3({
    accessKeyId: "hcs",
    secretAccessKey: "HCS!2022%",
    endpoint: "https://cloudinary.zstudy.co",
    signatureVersion: 'v4',
    s3ForcePathStyle: true
});

const Product = () => {

    document.title = "Product";

    const token = localStorage.getItem('jwtToken');

    const [cover_image, set_cover_image] = useState(null);
    const [formCategoryLoading, setFormProductLoading] = useState(false);
    const [productId, setProductId] = useState(0);
    const [editForm, setEditForm] = useState(false);

    useEffect(() => {
        let td_product = $('#td_product').DataTable({
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
                        collection: "product",
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
                        return data.image_uri ? `<nav class="nav nav-icon-only"><a href=${data.image_uri} target="_blank" class="nav-link"><i class="fa fa-eye"></i> View Image</a></nav>` : "Not Image";
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
                        return `<nav class="nav nav-icon-only">
                                    <a href="#" class="nav-link edit_product"><i class="fa fa-pencil-alt"></i> Edit</a><a href="#" class="nav-link delete"><i class="fa fa-trash-alt"></i> Delete</a>${!data.in_stock ? `<a href="#" class="nav-link update_stock"><i class="fa fa-check-circle"></i> In-Stock</a>` : `<a href="#" class="nav-link update_stock"><i class="fa fa-stop-circle"></i> Out-of-Stock</a>`}
                                </nav>`
                    },
                    "targets": 3
                }
            ]
        });

        td_product.on('click', '.delete', function(e) {
            e.preventDefault();
            let extract_td = td_product.row($(this).closest('tr')).data();

            let {hide} = cogoToast.loading('Please wait... contacting to server.', {position: "top-right"});
            deleteProduct(extract_td.raw._id, "delete").then((response) => {
                hide();
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    $('#td_product').DataTable().ajax.reload();
                }
            });
        });

        td_product.on('click', '.edit_product', function(e) {
            e.preventDefault();
            let extract_td = td_product.row($(this).closest('tr')).data();
            setProductId(extract_td.raw._id);
            setEditForm(true);
            $("#productName").val(extract_td.raw.name);
            $("#description").val(extract_td.raw.description);
            $("#amount").val(extract_td.raw.amount);

            $("#cover_image").prop("required", false);
            $("#modalProduct").modal({backdrop: 'static', keyboard: false}, "show");
        });

        td_product.on('click', '.update_stock', function(e) {
            e.preventDefault();

            const options = {
                position: "top-right",
                hideAfter: 0
            };

            let {hide} = cogoToast.loading('Please wait... contacting to server.', options);

            let extract_td = td_product.row($(this).closest('tr')).data();
            let _raw = {
                id: extract_td.raw._id,
                stock: !extract_td.raw.in_stock,
                action: "update"
            }

            addNewProduct(_raw).then((response) => {
                hide();
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    $('#td_product').DataTable().ajax.reload();
                }

                return false;
            });
        });

    }, []);

    const handleProductSubmit = async(e) => {
        e.preventDefault();

        setFormProductLoading(true);

        if(editForm) {
            let _raw = {
                id: productId,
                name: $("#productName").val(),
                description: $("#description").val(),
                amount: $("#amount").val(),
                image: cover_image ? await S3upload(cover_image) : null,
                action: "update"
            }

            addNewProduct(_raw).then((response) => {
                setFormProductLoading(false);
                if(!response.error) {
                    cogoToast.success(response.payload, {position: "top-right"});
                    onCloseModal("modalProduct", "product_form");
                    $('#td_product').DataTable().ajax.reload();
                }

                return false;
            });

            return false;
        }

        let raw = {
            name: $("#productName").val(),
            description: $("#description").val(),
            amount: $("#amount").val(),
            image: await S3upload(cover_image),
            action: "create"
        }

        addNewProduct(raw).then((response) => {
            setFormProductLoading(false);
            if(!response.error) {
                cogoToast.success(response.payload, {position: "top-right"});
                onCloseModal("modalProduct", "product_form");
                $('#td_product').DataTable().ajax.reload();
            }

            return false;
        });
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        setEditForm(false);
        $("#cover_image").prop("required", true);
        $('#product_form').parsley();
        $("#modalProduct").modal({backdrop: 'static', keyboard: false}, "show");
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
                                <li className="breadcrumb-item active" aria-current="page">Products</li>
                            </ol>
                        </nav>
                        <h4 className="mg-b-0 tx-spacing--1">Products</h4>
                    </div>
                    <div className="d-none d-md-block">
                        <button className="btn btn-sm pd-x-15 btn-primary btn-uppercase mg-l-5 outline-none" onClick={handleAddProduct.bind()}><i className="wd-10 mg-r-5 fa fa-plus"></i> Add New</button>
                    </div>
                </div>

                <div className="row row-xs">
                    <div className="col-md-12 mg-t-10">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between">
                                <h6 className="mg-b-0">Total Products</h6>
                                <div className="d-flex tx-18">
                                    <a href="javascript:void(0)" className="link-03 lh-0" onClick={handleAddProduct.bind()}><i className="icon ion-md-add"></i></a>
                                    <a href="javascript:void(0)" className="link-03 lh-0 mg-l-10" onClick={() => $('#td_product').DataTable().ajax.reload()}><i className="icon ion-md-refresh"></i></a>
                                </div>
                            </div>
                            <div className="card-body table-responsive">
                                <table id="td_product" className="table table-hover" style={{width: "100%"}}>
                                    <thead className="thead-light">
                                    <tr>
                                        <th className="wd-30p">Name</th>
                                        <th className="wd-20p">Image</th>
                                        <th className="wd-20p">Amount</th>
                                        <th className="wd-20p">Action</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="modalProduct" tabIndex="-1" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered wd-sm-650" role="document">
                    <div className="modal-content">
                        <div className="modal-header pd-y-20 pd-x-20 pd-sm-x-30">
                            <a href="#" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </a>
                            <div className="media-body">
                                <a href="" role="button" className="close pos-absolute t-15 r-15" data-dismiss="modal" onClick={onCloseModal.bind(null, "modalProduct", "product_form")} aria-label="Close">
                                    <span aria-hidden="true">×</span>
                                </a>
                                <h4 className="tx-18 tx-sm-20 mg-b-2" id="edit_title">Product</h4>
                                <p className="tx-13 tx-color-02 mg-b-0" id="edit_subtitle">Fill all the required field</p>
                            </div>
                        </div>
                        <div className="modal-body pd-sm-t-30 pd-sm-b-40 pd-sm-x-30">
                            <form id="product_form" className="parsley-style-1" onSubmit={handleProductSubmit.bind()}>
                                <div id="productNameWrapper" className="form-group parsley-input">
                                    <label>Name<span className="tx-danger">*</span></label>
                                    <input id="productName" type="text" className="form-control"
                                           placeholder="Enter product name"
                                           autoComplete="off"
                                           data-parsley-class-handler="#productNameWrapper" required/>
                                </div>

                                <div id="descriptionWrapper" className="form-group parsley-input">
                                    <label className="tx-10 tx-uppercase tx-medium tx-spacing-1 mg-b-5">Description</label>
                                    <textarea id="description" rows="5" className="form-control"
                                              placeholder="Provide a description"
                                              data-parsley-class-handler="#descriptionWrapper" required/>
                                </div>

                                <div id="amountWrapper" className="form-group parsley-input">
                                    <label>Amount<span className="tx-danger">*</span></label>
                                    <input id="amount" type="number" className="form-control"
                                           placeholder="Enter amount"
                                           autoComplete="off"
                                           data-parsley-class-handler="#amountWrapper" required/>
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

export default Product;
