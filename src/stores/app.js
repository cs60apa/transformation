import {createSlice} from '@reduxjs/toolkit';

const slice = createSlice({
    name: "app",
    initialState: {
        category: []
    },
    reducers: {
        //actions => action handlers
        CATEGORY: (state, action) => {
            return {
                ...state,
                category: action.payload.category,
            }
        }
    }
});

export const {CATEGORY} = slice.actions;
export default slice.reducer;
