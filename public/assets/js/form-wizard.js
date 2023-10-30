$(function(){
    'use strict';

    $('#wizard1').steps({
        headerTag: 'h3',
        bodyTag: 'section',
        autoFocus: true,
        titleTemplate: '<span class="number">#index#</span> <span class="title">#title#</span>',
        stepsOrientation: 1,
        onStepChanging: function (event, currentIndex, newIndex) {
            if(currentIndex < newIndex) {
                // Step 1 form validation
                if(currentIndex === 0) {
                    var ad_name = $('#ad_name').parsley();
                    var image = $('#image').parsley();
                    var ad_budget = $('#ad_budget').parsley();

                    if(ad_name.isValid() && image.isValid() && ad_budget.isValid()) {
                        return true;
                    } else {
                        ad_name.validate();
                        image.validate();
                        ad_budget.validate();
                    }
                }

                // Step 2 form validation
                if(currentIndex === 1) {
                    var email = $('#email').parsley();
                    if(email.isValid()) {
                        return true;
                    } else { email.validate(); }
                }
                // Always allow step back to the previous step even if the current step is not valid.
            } else { return true; }
        }
    });

    $('#wizard2').steps({
        headerTag: 'h3',
        bodyTag: 'section',
        autoFocus: true,
        titleTemplate: '<span class="number">#index#</span> <span class="title">#title#</span>',
        onStepChanging: function (event, currentIndex, newIndex) {
            if(currentIndex < newIndex) {
                // Step 1 form validation
                if(currentIndex === 0) {
                    var fname = $('#firstname').parsley();
                    var lname = $('#lastname').parsley();

                    if(fname.isValid() && lname.isValid()) {
                        return true;
                    } else {
                        fname.validate();
                        lname.validate();
                    }
                }

                // Step 2 form validation
                if(currentIndex === 1) {
                    var email = $('#email').parsley();
                    if(email.isValid()) {
                        return true;
                    } else { email.validate(); }
                }
                // Always allow step back to the previous step even if the current step is not valid.
            } else { return true; }
        }
    });

    $('#wizard3').steps({
        headerTag: 'h3',
        bodyTag: 'section',
        autoFocus: true,
        titleTemplate: '<span class="number">#index#</span> <span class="title">#title#</span>',
        stepsOrientation: 1
    });

    $('#wizard4').steps({
        headerTag: 'h3',
        bodyTag: 'section',
        autoFocus: true,
        titleTemplate: '<span class="number">#index#</span> <span class="title">#title#</span>'
    });

});
