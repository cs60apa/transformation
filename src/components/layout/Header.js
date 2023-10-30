import React, {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import $ from "jquery";
import feather from "feather-icons";
import {logoutUser, getCategory} from '../../request';
import PerfectScrollbar from 'perfect-scrollbar';
import {useDispatch, useSelector} from "react-redux";
import {capitalize} from "../../utils/capitalize";

const Header = () => {
    const dispatch = useDispatch();
    const auth = useSelector((state) => state.auth.user);
    const [statistics, set_statistics] = useState("nav-item");
    const [subscription, set_subscription] = useState("nav-item");
    const [artists, set_artists] = useState("nav-item");
    const [academia, set_academia] = useState("nav-item");
    const [grade, set_grade] = useState("nav-item");
    const [product, set_product] = useState("nav-item");
    const [book, set_book] = useState("nav-item");
    const [order, set_order] = useState("nav-item");
    const [access_control, set_access_control] = useState("nav-item");
    const [app, set_app] = useState("nav-item");
    const [push_notification, set_push_notification] = useState("nav-item");
    const [category, set_category] = useState("nav-item");
    const [course, set_course] = useState("nav-item");

    const onLogoutClick = (event) => {
        event.preventDefault();
        dispatch(logoutUser());
    };

    const handleActiveLink = (data) => {
        set_statistics("nav-item");
        set_access_control("nav-item");
        set_push_notification("nav-item");
        set_grade("nav-item");
        set_subscription("nav-item");
        set_academia("nav-item");
        set_app("nav-item");
        set_product("nav-item");
        set_book("nav-item");
        set_order("nav-item");
        set_artists("nav-item");
        set_category("nav-item");
        set_course("nav-item");
        switch (data) {
            case "dashboard":
                set_statistics("nav-item active");
                break;
            case "subscription":
                set_subscription("nav-item active");
                break;
            case "product":
                set_product("nav-item active");
                break;
            case "order":
                set_order("nav-item active");
                break;
            case "grade":
                set_grade("nav-item active");
                break;
            case "academia":
                set_academia("nav-item active");
                break;
            case "category":
                set_category("nav-item active");
                break;
            case "book":
                set_book("nav-item active");
                break;
            case "course":
                set_course("nav-item active");
                break;
            case "access_control":
                set_access_control("nav-item active");
                break;
            case "push_notification":
                set_push_notification("nav-item active");
                break;
            case "app":
                set_app("nav-item active");
                break;
            default:
                set_statistics("nav-item");
                break;
        }
    };

    useEffect(() => {

        handleActiveLink("default");
        dispatch(getCategory());

        $(function () {
            'use strict';
            feather.replace();

            const asideBody = new PerfectScrollbar('.aside-body', {
                suppressScrollX: true
            });

            if($('.aside-backdrop').length === 0) {
                $('body').append('<div class="aside-backdrop"></div>');
            }

            var mql = window.matchMedia('(min-width:992px) and (max-width: 1199px)');

            function doMinimize(e) {
                if (e.matches) {
                    $('.aside').addClass('minimize');
                } else {
                    $('.aside').removeClass('minimize');
                }

                asideBody.update()
            }

            mql.addListener(doMinimize);
            doMinimize(mql);

            $('.aside-menu-link').on('click', function(e){
                e.preventDefault();

                if(window.matchMedia('(min-width: 992px)').matches) {
                    $(this).closest('.aside').toggleClass('minimize');
                } else {

                    $('body').toggleClass('show-aside');
                }

                asideBody.update()
            });

            $('.nav-aside .with-sub').on('click', '.nav-link', function(e){
                e.preventDefault();

                $(this).parent().siblings().removeClass('show');
                $(this).parent().toggleClass('show');

                asideBody.update()
            });

            $('body').on('mouseenter', '.minimize .aside-body', function(e){
                console.log('e');
                $(this).parent().addClass('maximize');
            });

            $('body').on('mouseleave', '.minimize .aside-body', function(e){
                $(this).parent().removeClass('maximize');

                asideBody.update()
            });

            $('body').on('click', '.aside-backdrop', function(e){
                $('body').removeClass('show-aside');
            })
        });
    }, []);

    return (
        <aside className="aside aside-fixed">
            <div className="aside-header">
                <a href="#" className="aside-logo">Con<span>sole</span></a>
                <a href="#" className="aside-menu-link">
                    <i data-feather="menu"></i>
                    <i data-feather="x"></i>
                </a>
            </div>
            <div className="aside-body">
                <div className="aside-loggedin">
                    <div className="aside-loggedin-user">
                        <a href="#loggedinMenu" className="d-flex align-items-center justify-content-between mg-b-2"
                           data-toggle="collapse">
                            <h6 className="tx-semibold mg-b-0">{capitalize(auth.user.name)}</h6>
                            <i data-feather="chevron-down"></i>
                        </a>
                        <p className="tx-color-03 tx-12 mg-b-0">{capitalize(auth.user.role)}</p>
                    </div>
                    <div className="collapse" id="loggedinMenu">
                        <ul className="nav nav-aside mg-b-0">
                            <li className="nav-item"><Link to="#" onClick={onLogoutClick.bind()} className="nav-link"><i data-feather="log-out"></i>
                                <span>Sign Out</span></Link></li>
                        </ul>
                    </div>
                </div>

                <ul className="nav nav-aside">
                    <li className="nav-label">General</li>
                    <li className={statistics}><Link to="/dashboard" onClick={handleActiveLink.bind(null, "dashboard")} className="nav-link"><i data-feather="users"></i> <span>Users</span></Link></li>
                    <li className={subscription}><Link to="/subscription" onClick={handleActiveLink.bind(null, "subscription")} className="nav-link"><i data-feather="trending-up"></i> <span>Subscriptions</span></Link></li>
                    <li className={product}><Link to="/product" onClick={handleActiveLink.bind(null, "product")} className="nav-link"><i data-feather="tag"></i> <span>Products</span></Link></li>
                    <li className={order}><Link to="/order" onClick={handleActiveLink.bind(null, "order")} className="nav-link"><i data-feather="credit-card"></i> <span>Orders</span></Link></li>
                    <li className={book}><Link to="/book" onClick={handleActiveLink.bind(null, "book")} className="nav-link"><i data-feather="book-open"></i> <span>Books</span></Link></li>
                    <li className={academia}><Link to="/academia" onClick={handleActiveLink.bind(null, "academia")} className="nav-link"><i data-feather="briefcase"></i> <span>Academia</span></Link></li>
                    <li className={grade}><Link to="/grade" onClick={handleActiveLink.bind(null, "grade")} className="nav-link"><i data-feather="sliders"></i> <span>Grade</span></Link></li>

                    <li className="nav-label mg-t-25">Courses</li>
                    <li className={category}><Link to="/category" onClick={handleActiveLink.bind(null, "category")} className="nav-link"><i data-feather="disc"></i> <span>Category</span></Link></li>
                    <li className={course}><Link to="/course" onClick={handleActiveLink.bind(null, "course")} className="nav-link"><i data-feather="film"></i> <span>Courses</span></Link></li>

                    <li className="nav-label mg-t-25">Settings</li>
                    <li className={push_notification}><Link to="/push-notification" onClick={handleActiveLink.bind(null, "push_notification")} className="nav-link"><i data-feather="bell"></i> <span>Push Notification</span></Link></li>
                    <li className={access_control}><Link to="/access-control" onClick={handleActiveLink.bind(null, "access_control")} className="nav-link"><i data-feather="users"></i> <span>Access Control</span></Link></li>
                    <li className={app}><Link to="/app" onClick={handleActiveLink.bind(null, "app")} className="nav-link"><i data-feather="smartphone"></i> <span>App</span></Link></li>
                </ul>
            </div>
        </aside>
    );
};

export default Header;
