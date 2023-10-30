import cogoToast from "cogo-toast";

const errorHandler = (error, position) => {
    const option = {
        position: position,
        hideAfter: 5
    };

    if(error.response) {
        switch (error.response.status) {
            case 401:
                cogoToast.error("Invalid Email address or password!", option);
                break;
            case 422:
                cogoToast.error( error.response.data['error'].details !== undefined ? error.response.data['error'].details[0].message : error.response.data['error'], option);
                break;
            default:
                cogoToast.error("Error 446: Something went wrong!.", option);
        }
    } else {
        cogoToast.error("Error 500: Server connection failed!.", option);
    }
};

export default errorHandler;
