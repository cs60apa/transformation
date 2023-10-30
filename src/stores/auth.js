import {createSlice} from '@reduxjs/toolkit';
import isEmpty from "../validation/is-empty";

const slice = createSlice({
    name: "auth",
    initialState: {
        isAuthenticated: false,
        user: false
    },
    reducers: {
        //actions => action handlers
        SET_AUTH_USER: (state, action) => {
            return {
                ...state,
                isAuthenticated: !isEmpty(action.payload),
                user: action.payload
            };
        },
        UNSET_USER: () => {
            return {
                isAuthenticated: false,
                user: false
            }
        }
    }
});

export const {SET_AUTH_USER, UNSET_USER} = slice.actions;
export default slice.reducer;
