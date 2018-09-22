// Logout //
function logout() {
  $.ajax({
    type: "POST",
    url: "/signout",
    success: function(response) {
      window.location.href = "/login";
    },
  });
}
