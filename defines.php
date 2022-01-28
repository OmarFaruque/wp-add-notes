<?php

if (function_exists('plugin_dir_url')) {//Prevent directly browsing to the file
	define ('RESPONSIVESTICKYNOTES_VERSION',        '1.0.0');
	define( 'RESPONSIVESTICKYNOTES_PLUGIN_DIR', 	untrailingslashit( dirname( __FILE__ ) ) );
}

else {
	error_reporting(0);
	$port = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] != "off") ? "https://" : "http://";
	$url = $port . $_SERVER["HTTP_HOST"];
	header("HTTP/1.1 404 Not Found", true, 404);
	header("Status: 404 Not Found");
	exit();
}