import axios from 'axios';
import {
    COURSE_URL,
    ACADEMIA_URL,
    PUSH_NOTIFICATION,
    ACTION_NOTIFICATION,
    ACADEMIC_COPY_COURSE_URL,
    ACTION_ADMIN_URL,
    ACTION_ARTIST_URL,
    ACTION_ALBUM_URL,
    ACTION_TRACK_URL,
    ACTION_VIDEO_URL,
    ACTION_COURSE_URL,
    ACTION_APP_URL,
    GET_CATEGORY_URL,
    ACTION_CATEGORY_URL,
    ACTION_AUDIO_URL,
    ACTION_PRODUCT_URL,
    ACADEMIC_URL,
    ACTION_BOOK_URL,
    GET_ACADEMIA_URL,
    GRADE_URL,
    STUDENT_URL
} from '../api';
import errorHandler from "../utils/errorHandler";
import {CATEGORY} from "../stores/app";
import setAuthToken from "../utils/setAuthToken";
import {SET_AUTH_USER} from "../stores/auth";
import jwt_decode from "jwt-decode";

const {GET_FILE_URL} = require("../api");


export const getAcademia = (id) => {
    return axios.get(GET_ACADEMIA_URL(id)).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
}
export const sendPushNotification = (data) => {
    return axios.post(PUSH_NOTIFICATION, {
        topic: data.topic,
        title: data.title,
        raw_message: data.raw_message
    }).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            error: true
        }
    });
};

export const actionNotification = (data) => {
    return axios.post(ACTION_NOTIFICATION, data).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            error: true
        }
    });
}

export const actionAdmin = (data) => {
    return axios.post(ACTION_ADMIN_URL, data).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((error) => {
        return {
            data: error,
            error: true
        }
    });
}

export const actionArtist = (data, config) => {
    return axios.post(ACTION_ARTIST_URL, data, config).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((err) => {
        return {
            data: err,
            error: true
        }
    });
};

export const actionAlbum = (data, config) => {
    return axios.post(ACTION_ALBUM_URL, data, config).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((err) => {
        return {
            data: err,
            error: true
        }
    });
};

export const actionAudio = (data) => {
    return axios.post(ACTION_AUDIO_URL, data).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((err) => {
        return {
            data: err,
            error: true
        }
    });
};

export const actionTrack = (data, config) => {
    return axios.post(ACTION_TRACK_URL, data, config).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((err) => {
        return {
            data: err,
            error: true
        }
    });
}

export const actionVideo = (data) => {
    return axios.post(ACTION_VIDEO_URL, data).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((err) => {
        return {
            data: err,
            error: true
        }
    });
}

export const actionCourse = (data) => {
    return axios.post(ACTION_COURSE_URL, data).then((response) => {
        return {
            data: response.data.payload,
            error: false
        }
    }).catch((err) => {
        return {
            data: err,
            error: true
        }
    });
}

export const course = (method, data) => {
    return axios({method: method, url: COURSE_URL, data: data}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
}

export const academia = (method, data) => {
    return axios({method: method, url: ACADEMIA_URL, data: data}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
}

export const student = (method, data) => {
    return axios({method: method, url: STUDENT_URL, data: data}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
}

export const academic = (method, data) => {
    return axios({method: method, url: ACADEMIC_URL, data: data}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
}

export const academicCopyCourse = (method, data) => {
    return axios({method: method, url: ACADEMIC_COPY_COURSE_URL, data: data}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
}

export const grade = (method, data) => {
    return axios({method: method, url: GRADE_URL, data: data}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
}

export const downloadTrack = (filename, config) => {
    return axios.get(`${GET_FILE_URL}/${filename}`, config).then((response) => {
        return {
            data: response.data,
            error: false
        }
    }).catch((err) => {
        return {
            data: err,
            error: true
        }
    });
};

export const updateCompany = (raw) => {
    return function(dispatch) {
        return axios.post(ACTION_APP_URL, raw).then((response) => {
            //Set token to localStorage
            localStorage.setItem('jwtToken', response.data.token);

            //Set token to Auth header
            setAuthToken(response.data.token);

            //Set current user
            dispatch(SET_AUTH_USER({user: jwt_decode(response.data.token)}));
            return {
                payload: response.data.payload,
                error: false
            }
        }).catch((error) => {
            errorHandler(error, "top-right");
            return {
                payload: null,
                error: true
            }
        });
    }
};

export const updatePassword = (id, c_password, n_password, action) => {
    return axios.post(ACTION_APP_URL, {id, c_password, n_password, action}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const paymentActivation = (id, action) => {
    return axios.post(ACTION_APP_URL, {id, action}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const deletePackage = (id, action) => {
    return axios.post(ACTION_APP_URL, {id, action}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const deleteCategory = (id, action) => {
    return axios.post(ACTION_CATEGORY_URL, {id, action}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const deleteProduct = (id, action) => {
    return axios.post(ACTION_PRODUCT_URL, {id, action}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const addNewProduct = (raw) => {
    return axios.post(ACTION_PRODUCT_URL, raw).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const deleteBook = (id, action) => {
    return axios.post(ACTION_BOOK_URL, {id, action}).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const actionBook = (raw) => {
    return axios.post(ACTION_BOOK_URL, raw).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const addNewPackage = (raw) => {
    return axios.post(ACTION_APP_URL, raw).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const addNewCategory = (raw) => {
    return axios.post(ACTION_CATEGORY_URL, raw).then((response) => {
        return {
            payload: response.data.payload,
            error: false
        }
    }).catch((error) => {
        errorHandler(error, "top-right");
        return {
            payload: null,
            error: true
        }
    });
};

export const getCategory = () => {
    return function(dispatch) {
        return axios.post(GET_CATEGORY_URL).then((response) => {
            dispatch(CATEGORY({category: response.data.payload}));
        }).catch(() => {
            return null;
        });
    }
};

