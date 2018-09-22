document.addEventListener("DOMContentLoaded", function () {
    const user = document.getElementById('myAccountDropdown').dataset.user;
    loadNotifications(user);
});

const noAlertsHtmlFragment = `<center><p style="margin-top:20px"></p></center><center><p style="margin-top:20px">No alerts at this time.</p></center>`;

function loadNotifications(user) {
    var data = {
        user: user,
    };
    return fetch('/countNotifications', {
            method: 'POST', // or 'PUT'
            body: JSON.stringify(data), // data can be `string` or {object}!
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            return res.json();
        })
        .then((json) => {
            console.log("JSON: ", json);
            if (json.count > 0) {
                document.getElementById('notificatonCounter').style.visibility = 'inherit';
                document.getElementById('notificatonCounter').innerHTML = json.count;
            } else {
                document.getElementById('notificatonCounter').style.visibility = 'hidden';
            }

            if (json.notifications.length) {
                $("#listNotifications").empty()
                for (let i = 0; i < json.notifications.length; i++) {

                    $("#listNotifications").append(
                        `<div class="dropdown-item noti-main-row" id="main${json.notifications[i].id2}" >
                            <div class="notification-text"><p>${json.notifications[i].notification}</p>
                            <p class="text-right"><span class="blue">${json.notifications[i].createdAt}</span></p></div>
                            <input type="image" class="close-icon-middle" 
                                onclick="removeNotification(event, this)" onmouseover="iconOver(this)" onmouseout="iconOut(this)" 
                                id="${json.notifications[i]._id}" title="remove" style="cursor:pointer;" src="/img/X_icon_24x24.png">
                        </div>`
                    );
                }
            } else {
                if (!$("#listNotifications").find(".noti-main-row").length) {
                    $("#listNotifications").html(noAlertsHtmlFragment);
                }
            }
        })
        .catch(error => console.error('Error:', error))
}

$("#notifications").click(function () {
    $('#notificatonCounter').css('visibility', 'hidden');
    $.ajax({
        type: "POST",
        url: "/markCurrentUserNotificationsRead"
    });
})

function removeNotification(event, obj) {
    event.stopPropagation();
    $.ajax({
        type: "DELETE",
        data: {
            "notificationId": obj.id
        },
        url: "/removeCurrentUserNotification",
        success: function (response) {
            document.getElementById(obj.parentElement.id).remove();
            if (!$("#listNotifications").find(".noti-main-row").length) {
                $("#listNotifications").html(noAlertsHtmlFragment);
            }
        },
    });
}

function iconOver(obj) {
    obj.src = '/img/X_Hover_656565_24x24.png'
}

function iconOut(obj) {
    obj.src = '/img/X_icon_24x24.png'
}



$('body').click(function (evt) {

    if (evt.target.class == "message-box" ||
        $(evt.target).closest('.message-box').length) {
        return;
    }

});