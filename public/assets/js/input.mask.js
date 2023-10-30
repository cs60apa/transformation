var citynames = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: {
        url: '../assets/data/citynames.json',
        filter: function(list) {
            return $.map(list, function(cityname) {
                return { name: cityname }; });
        }
    }
});

citynames.initialize();

$('#input2').tagsinput({
    typeaheadjs: {
        name: 'citynames',
        displayKey: 'name',
        valueKey: 'name',
        source: citynames.ttAdapter()
    }
})
