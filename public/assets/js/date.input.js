$(function(){
    'use strict';

    $('#start_from').datepicker({
        showOtherMonths: true,
        selectOtherMonths: true,
        minDate: 2,
        defaultDate: '+1w',
        numberOfMonths: 1,
        dateFormat: 'yy/mm/dd',
        onSelect: function() {
            return $(this).trigger('change');
        }
    });

    $('#end_from').datepicker({
        showOtherMonths: true,
        selectOtherMonths: true,
        minDate: 2,
        defaultDate: '+1w',
        numberOfMonths: 1,
        dateFormat: 'yy/mm/dd',
        onSelect: function() {
            return $(this).trigger('change');
        }
    });

    $('#date_from').datepicker({
        showOtherMonths: true,
        selectOtherMonths: true,
        minDate: 2,
        defaultDate: '+1w',
        numberOfMonths: 1,
        dateFormat: 'yy/mm/dd',
        onSelect: function() {
            return $(this).trigger('change');
        }
    });
});
