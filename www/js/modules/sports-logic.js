$(document).on("pageshow", "#sports", function() {
	var opened = window.open("http://hochschulsport-potsdam.de", "_blank");
	if (opened) {
		// $.mobile.navigate("campus.html");
		opened.addEventListener("exit", function() { $.mobile.navigate("campus.html"); });
	}
});
