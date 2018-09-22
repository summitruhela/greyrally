// =========================================================================
//
// user jquery-library for searching. checkout documentation
// https://www.jqueryscript.net/form/Google-Style-Search-Suggestion-Plugin-For-jQuery-Suggestion-Box.html
//
// =========================================================================

$('#m_quicksearch_input').suggestionBox({
                              filter: false,
                              widthAdjustment: 70,
                              leftOffset: -50,
                              topOffset: 25,
                              noSuggestionsMessage: 'No Data Found',
                              menuWidth: 'auto',
                              url: '/search',
                              paramName: 'query',
                              ajaxSuccess: function (data) {
                              },
                              ajaxError: function (e) {
                              },
                              heading: 'Suggestions',
}).getSuggestions();
