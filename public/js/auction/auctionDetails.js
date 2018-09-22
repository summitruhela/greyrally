// START OF BIDDING ON AN ACUTION
(function () {
    'use strict';
    window.addEventListener('load', function () {
        var bidForm = document.getElementById('bidOnAuction');
        bidForm.addEventListener('submit', function (event) {

            // Get values from form
            var currentBid = document.getElementById('bidTitle').value;
            var bidValue = document.getElementById('your-bid').value;
            var pinValue = document.getElementById('bid-pin').value;

            // Pass values into function to verify
            var isBidValid = checkAuctionBid(bidValue, currentBid);
            var isPinValid = checkBidPinIsValid(pinValue);

            if (!isBidValid) {
                event.preventDefault();
                event.stopPropagation();

                if (document.getElementById('your-bid').classList.contains('is-valid')) {
                    document.getElementById('your-bid').classList.remove('is-valid')
                    document.getElementById('your-bid').classList.add('is-invalid');
                } else {
                    document.getElementById('your-bid').classList.add('is-invalid');
                }
            } else {
                if (document.getElementById('your-bid').classList.contains('is-invalid')) {
                    document.getElementById('your-bid').classList.remove('is-invalid')
                    document.getElementById('your-bid').classList.add('is-valid');
                } else {
                    document.getElementById('your-bid').classList.add('is-valid');
                }
            }

            if (!isPinValid) {
                event.preventDefault();
                event.stopPropagation();

                if (document.getElementById('bid-pin').classList.contains('is-valid')) {
                    document.getElementById('bid-pin').classList.remove('is-valid')
                    document.getElementById('bid-pin').classList.add('is-invalid');
                } else {
                    document.getElementById('bid-pin').classList.add('is-invalid');
                }
            } else {
                if (document.getElementById('bid-pin').classList.contains('is-invalid')) {
                    document.getElementById('bid-pin').classList.remove('is-invalid')
                    document.getElementById('bid-pin').classList.add('is-valid');
                } else {
                    document.getElementById('bid-pin').classList.add('is-valid');
                }
            }

            if (isBidValid && isPinValid) {
                bidOnAuction(bidValue, pinValue);
            }

        }, false);
    }, false);
})();
//END OF BIDDING ON AN AUCTION

// START OF BUYING OUT AN AUCTION
(function () {
    'use strict';
    window.addEventListener('load', function () {
        var buyoutForm = document.getElementById('buyoutAuction');

        buyoutForm.addEventListener('submit', function (event) {

            // Get values from form
            var pinValue = document.getElementById('buyout-pin').value;

            // Pass values into function to verify
            var isPinValid = checkBuyoutPinIsValid(pinValue);

            if (!isPinValid) {
                event.preventDefault();
                event.stopPropagation();

                if (document.getElementById('buyout-pin').classList.contains('is-valid')) {
                    document.getElementById('buyout-pin').classList.remove('is-valid')
                    document.getElementById('buyout-pin').classList.add('is-invalid');
                } else {
                    document.getElementById('buyout-pin').classList.add('is-invalid');
                }
            } else {
                if (document.getElementById('buyout-pin').classList.contains('is-invalid')) {
                    document.getElementById('buyout-pin').classList.remove('is-invalid')
                    document.getElementById('buyout-pin').classList.add('is-valid');
                } else {
                    document.getElementById('buyout-pin').classList.add('is-valid');
                }
            }

            if (isPinValid) {
                buyoutAuction(pinValue);
            }

        }, false);
    }, false);
})();
// END OF BUYING OUT AN AUCTION

// START OF VALIDATION CHECKS
function checkAuctionBid(bidValue, currentBid) {
    if (bidValue !== "") {
        if (bidValue.match(/^[0-9]\d*(\.\d+)?$/) == null) {
            document.getElementById('bidAmountError').innerHTML = "Please enter a numeric value.";
            return false;
        } else if (bidValue > 0 && bidValue < currentBid) {
            document.getElementById('bidAmountError').innerHTML = "Your bid must be higher than " + currentBid;
            return false;
        } else {
            return true;
        }

    } else {
        document.getElementById('bidAmountError').innerHTML = "Bid value cannot be empty.";
        return false;
    }

}

function checkBidPinIsValid(pinValue) {
    if (pinValue !== "") {
        if (pinValue.match(/^\d+$/) == null) {
            document.getElementById('bidPinError').innerHTML = "Your pin should be a mix of numbers between 0 and 9.";
            return false;
        } else if (pinValue.length != 6) {
            document.getElementById('bidPinError').innerHTML = "Your pin should be 6 digits long.";
            return false;
        } else {
            return true;
        }
    } else {
        document.getElementById('bidPinError').innerHTML = "Pin cannot be empty.";
        return false;
    }

}

function checkBuyoutPinIsValid(pinValue) {
    if (pinValue !== "") {
        if (pinValue.match(/^\d+$/) == null) {
            document.getElementById('buyoutPinError').innerHTML = "Your pin should be a mix of numbers between 0 and 9.";
            return false;
        } else if (pinValue.length != 6) {
            document.getElementById('buyoutPinError').innerHTML = "Your pin should be 6 digits long.";
            return false;
        } else {
            return true;
        }
    } else {
        document.getElementById('buyoutPinError').innerHTML = "Pin cannot be empty.";
        return false;
    }

}

function bidOnAuction(bidValue, pinValue) {
    console.log("BID VALUE: ", bidValue);
    console.log("PIN VALUE: ", pinValue);
    document.getElementById('makeBid').disabled = "true"
    let url = window.location.pathname;
    let queryParams = url.split('/');
    let auctionName = queryParams[4];
    let user = queryParams[2];
    var data = {
        bidValue: bidValue,
        pinValue: pinValue,
        auctionName: auctionName,
        user: user
    };
    console.log("DATA: ", data);
    //TODO: hookup submitting a bid... hopefull we can get a better URL to post to besides url: "/users/" + user + "/auctions/" + auctionName + "/bid",

    // return fetch('/create-auction', {
    //         method: 'POST', // or 'PUT'
    //         body: JSON.stringify(data), // data can be `string` or {object}!
    //         headers: {
    //             'Accept': 'application/json, text/plain, */*',
    //             'Content-Type': 'application/json'
    //         }
    //     }).then((res) => {
    //         return res.json();
    //     })
    //     .then((json) => {
    //         console.log("JSON: ", json);
    //     })
    //     .catch(error => console.error('Error:', error))
}

function buyoutAuction(pinValue) {
    console.log("PIN VALUE: ", pinValue);
}

// $('#deleteIt').click(function () {
//     swal({
//             title: "Are you sure?",
//             text: "You will not be able to recover this imaginary file!",
//             type: "warning",
//             showCancelButton: true,
//             confirmButtonClass: "btn-danger",
//             confirmButtonText: "Yes, delete it!",
//             cancelButtonText: "No, cancel plx!",
//             closeOnConfirm: false,
//             closeOnCancel: false
//         },
//         function (isConfirm) {
//             if (isConfirm) {
//                 url = window.location.pathname;
//                 let auction = url.split('/');
//                 let auctionName = auction[4];
//                 $.ajax({
//                     type: "POST",
//                     url: "/auctions/" + auctionName + "/delete",
//                     success: function (response) {
//                         swal({
//                             title: "Success!",
//                             text: "Redirecting in 2 seconds.",
//                             type: "success",
//                             timer: 2000,
//                             showConfirmButton: false
//                         }, function () {
//                             window.location.href = "/users/" + auction[2] + "/auctions";
//                         });
//                     },
//                 });
//             } else {
//                 swal("Canceled", "Your auction details are safe :)", "error");
//             }
//         }, 1000);
// })



// $("#count-down").countdown(Date.parse($('#expiration').val()), function (event) {
//     $(this).text(
//         event.strftime('%w week %d days %H:%M:%S')
//     );
// });


// $("#buyIt").click(function (e) {
//     $('#buyIt').prop("disabled", true);
//     $('#buyIt').css('background-color', '#808080d6');
//     url = window.location.pathname;
//     let queryParams = url.split('/');
//     let auctionName = queryParams[4];
//     let user = queryParams[2];
//     let inputValue = $("#buyout-pin").val();
//     $.ajax({
//         type: "POST",
//         url: "/users/" + user + "/auctions/" + auctionName + "/buy",
//         data: {
//             pin: inputValue,
//         },
//         success: function (response) {
//             if (response == "1") {
//                 $("#makeBuy").find(".modal-content").children().hide();
//                 let buySuccessfully =
//                     `<div id="buySuccessfully"><p>Sold! You’ve just won an auction!</p><br>
//                                     <p>You will receive an email with further
//                                     instructions.</p></div>`;
//                 $("#makeBuy").find(".modal-content").append(buySuccessfully);

//                 window.location.href = "/users/" + user + "/auctions/" + auctionName;
//             } else if (response == "2") {
//                 $("#makeBuy").find(".modal-content").children().hide();
//                 let incorrectPinErr =
//                     `<div id="incorrectPinErr" style="height:130px"><br/><center><h2 style="color: #797979">Opps</h2></center><br/><center><p style="font-size: 15px; font-weight: bold; color: #797979">Incorrect Pin :(</p></center></div>`;
//                 $("#makeBuy").find(".modal-content").append(incorrectPinErr);
//             } else if (response == "0") {
//                 $("#makeBuy").find(".modal-content").children().hide();
//                 let unSufficientBalance =
//                     `<div id="unSufficientBalanceErr"><p style="font-size: 15px; font-weight: bold; color: #797979">You do not have sufficient funds for this transaction :( </p> <br> <p style="font-size: 15px; font-weight: 600;"> <u><a style="    color: #52ACF5;" href="/users/` +
//                     user + `/wallet">Add funds to your account here.</a></u></p> </div>`;
//                 $("#makeBuy").find(".modal-content").append(unSufficientBalance);
//             }
//         },
//     });
// });
// $("#makeBuy").on('hidden.bs.modal', function () {
//     $(this).find("#unSufficientBalanceErr").remove();
//     $(this).find("#buySuccessfully").remove();
//     $(this).find("#incorrectPinErr").remove();
//     $(this).find(".modal-content").children().show();
// });


// var socket = io();
// socket.on('bidUpdate', function (response) {
//     $("#" + response.auction).html('<i class="fab fa-bitcoin" aria-hidden="true"></i>' + response.newBid);
//     $("#" + response.auction).html(
//         '<span style="color:#F7921A; font-weight:400;"><i class="fab fa-bitcoin" aria-hidden="true"></i>' + (
//             Number(response.newBid)) + '</span>');
// });