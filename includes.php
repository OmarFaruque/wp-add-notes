<?php
if ( ! defined( 'RESPONSIVESTICKYNOTES_VERSION' ) ) exit; // Exit if accessed directly

if (is_admin() == true) {

	/* The WP_List_Table class technically isn't an official API, so may change without notice - hence including a copy here */
	if(!class_exists('WP_List_Table_copy')){ //
		require_once('admin/class-wp-list-table-copy.php') ;
	}
	
	require_once('admin/admin.php');


}

require_once('note.php');
require_once('ajax/ajax-callbacks.php');