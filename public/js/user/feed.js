$(document).ready(function() {
    let limit = document.getElementById("totalAuctionslength").value;

    let auctionlength = document.getElementById("auctionlength").value;
    if (limit > auctionlength) {
      $("#loadmoreForm").submit(function(event) {
        // alert('load')
        console.log(`Limit is ${limit} and auctionLength is ${auctionlength}`)
        event.preventDefault();
        $this = $(this);
        var currentLimit = getParameterByName('limit') || 10;
        limit =  Number(currentLimit) + 10;
        var url = $this.attr('action') + '?limit=' + limit;
        window.location.href = url;
      });
    } else {
        $("#loadmore").prop("disabled", true);
    }

});

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

