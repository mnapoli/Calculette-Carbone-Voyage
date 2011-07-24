
/**
 * Messagebox constants
 */
const MSGBOX_NORMAL = 0;
const MSGBOX_SUCCESS = 1;
const MSGBOX_ERROR = 2;

/**
 * Show a message box to the user
 * @param {String} message Message to display
 * @param {int} type Type of the message (MSGBOX_NORMAL, MSGBOX_ERROR or MSGBOX_SUCCESS)
 * @param {String} title Title of the message box (default: "Information")
 * @return void
 */
function messageBox(message, title, type) {
	if (type === undefined) {
		type = MSGBOX_NORMAL;
	}
	if (title === undefined) {
		title = "Information";
	}
	// Display the message in the div #message
	$("#messagebox").html(message);
	$("#messagebox").dialog({
		title: title,
		show: "fade",
		buttons: {
			Ok: function() {
				$(this).dialog("close");
			}
		}
	});
}
