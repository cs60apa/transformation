import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import thunkMiddleware from 'redux-thunk';
import rootReducer from './reducer';
import { composeWithDevTools } from 'redux-devtools-extension';
import {loadState, saveState} from "../utils/localStorage";

const store = createStore(rootReducer, loadState(), compose(
    compose(
        composeWithDevTools(applyMiddleware(
            thunk,
            thunkMiddleware
        ))
    )
));

store.subscribe(() => saveState(store.getState()));

export default store;
