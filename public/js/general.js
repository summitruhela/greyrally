// JavaScript Document

// password only

//has lowercase
window.Parsley.addValidator('lowercase', {
  requirementType: 'number',
  validateString: function (value, requirement) {
    var lowecases = value.match(/[a-z]/g) || [];
    return lowecases.length >= requirement;
  },
  messages: {
    en: 'Your password must contain at least (%s) lowercase letter.'
  }
});

//has number
window.Parsley.addValidator('number', {
  requirementType: 'number',
  validateString: function (value, requirement) {
    var numbers = value.match(/[0-9]/g) || [];
    return numbers.length >= requirement;
  },
  messages: {
    en: 'Your password must contain at least (%s) number.'
  }
});

//has special char
window.Parsley.addValidator('special', {
  requirementType: 'number',
  validateString: function (value, requirement) {
    var specials = value.match(/[^a-zA-Z0-9]/g) || [];
    return specials.length >= requirement;
  },
  messages: {
    en: 'Your password must contain at least (%s) special characters.'
  }
});

// Registration Form Validation End

// Check whether email already registered with us ??
function checkEmailAvailability() {
  let email = document.getElementsByName('email')[0].value;

  if (email.length > 7) {
    $("img#emailGif").css("display", "block");
    $.ajax({
      type: "POST",
      url: "/checkEmailAvailability",
      data: {
        email: email
      },
      success: function (response) {
        $("img#emailGif").css("display", "none");
        if (response.userAvailable == 0) {
          $("#emailErr").text("");
          if ($("#emailErr").text("") &&
            ($('#password1').val()) &&
            ($('#password2').val()) &&
            ($('#password1').val() == $('#password2').val()) &&
            ($('#PGP').val()) &&
            ($('#usernameErr').text() == '') &&
            ($('#emailErr').text() == '') &&
            ($('#rasonToJoin').val()) &&
            ($('#pin').val()) &&
            ($("input[name='confirmation']:checked").length != "0")) {
            $('#save').prop("disabled", false);
            $('#save').css('background-color', '#F7921A');
          } else {
            $('#save').prop("disabled", true);
            $('#save').css('background-color', '#E1E1E1');
          }
        } else {
          $('#save').prop("disabled", true);
          $('#save').css('background-color', '#E1E1E1');
          $("#emailErr").text("Email already registered.");
        }
      },
    });
  } else {
    $("#emailErr").text("Enter Valid Email address.");
    $('#save').prop("disabled", true);
    $('#save').css('background-color', '#E1E1E1');
  }
}



// TODO: Check whether email already resigtered with us ??
function checkUsernameAvailability() {
  let username = document.getElementById('usernameSignup').value;
  if (username.length == 0) {
    $("#usernameErr").text("Enter Valid Username.");
    $('#save').prop("disabled", true);
    $('#save').css('background-color', '#E1E1E1');
    return;
  }
  let reg = /[^A-Za-z0-9_-]/;
  if (reg.test(username)) {
    $("#usernameErr")
      .text("Special characters or blank spaces not allowed. Use '-' or '_' instead.");
  } else {
    $("img#usernameGif").css("display", "block");
    $.ajax({
      type: "POST",
      url: "/checkusernameAvailability",
      data: {
        userName: username
      },
      success: function (response) {
        $("img#usernameGif").css("display", "none");
        if (response.userAvailable == 0) {
          $("#usernameErr").text("");
          if (($('#password1').val()) &&
            ($('#password2').val()) &&
            ($('#password1').val() == $('#password2').val()) &&
            ($('#PGP').val()) &&
            ($('#usernameErr').text() == '') &&
            ($('#emailErr').text() == '') &&
            ($('#rasonToJoin').val()) &&
            ($('#pin').val()) &&
            ($("input[name='confirmation']:checked").length != "0")) {
            $('#save').prop("disabled", false);
            $('#save').css('background-color', '#F7921A');
          } else {
            $('#save').prop("disabled", true);
            $('#save').css('background-color', '#E1E1E1');
          }
        } else {
          $('#save').prop("disabled", true);
          $('#save').css('background-color', '#E1E1E1');
          $("#usernameErr").text("Username already registered.");
        }
      },
    });
  }
}


// Registration Form Validation End
$(document).ready(function () {
  $(".popover-message").on("mouseover", function () {
    $(this).siblings("span.iconed-info").show();
  });
  $(".popover-message").on("mouseout", function () {
    $(this).siblings("span.iconed-info").hide();
  });
});