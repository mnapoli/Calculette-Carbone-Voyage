
/**
 * Messagebox constants
 */
const MSGBOX_ERROR = 0;
const MSGBOX_SUCCESS = 1;

/**
 * Show a message box to the user
 * @param {String} message Message to display
 * @param {int} type Type of the message (MSGBOX_ERROR or MSGBOX_SUCCESS)
 * @param {String} title Title of the message box (default: "Information:")
 * @return void
 */
function messageBox(message, type, title) {
	if (type === undefined) {
		type = MSGBOX_ERROR;
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
