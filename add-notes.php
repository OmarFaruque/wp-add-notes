<?php
/*
Plugin Name: Noting Plugin
Description: This plugin lets your registered users to take note on any post or page of your website and all those notes are saved to his admin page in the website. The table of notes can be later exported as CSV file.
Version: 2.0.0
Author: Omar Faruque

*/

require_once("defines.php");
require_once("includes.php");
add_action( 'wp_enqueue_scripts', 'responsivestickynotes_loadscripts' );

function responsivestickynotes_loadscripts(){
	$loadNotes = false;
	if ( is_user_logged_in() ) {
		$showalways = get_option('responsive-sticky-notes_showalways',1); //default is to show always, in case of upgrade
		$loadNotes = RESPONSIVESTICKYNOTES_note::can_edit();
	} else {
		$showalways = get_option('responsive-sticky-notes_showalways',0);
	}

	if ($showalways != 0) {
		$loadNotes = true;
	}
	// else {
	// 	$current_user = wp_get_current_user();
	// 	$loadNotes = RESPONSIVESTICKYNOTES_note::can_edit();
	// }
	if ($loadNotes==true) {
		add_action( 'wp_footer','responsivestickynotes_ajaxurl');
		add_action( 'init', 'responsivestickynotes_create_posttype');

		if (!is_admin()&&RESPONSIVESTICKYNOTES_note::can_edit() )
			// add_action('admin_bar_menu', 'responsivestickynotes_add_admin_button', 998);
			add_action('wp_head', 'responsivestickynotes_add_button');
		//To add text editor
		wp_enqueue_editor();
		//Register & Enqueue plugin js
		wp_register_script( 'todo_notes_note', plugins_url( '/js/sticky-notes-note.js', __FILE__ ), array( 'jquery'), false, true );
		wp_register_script( 'todo_notes_single', plugins_url( '/js/sticky-notes-single.js', __FILE__ ), array( 'todo_notes_note'), false, true );
		wp_enqueue_script( 'todo_notes_note' );
		wp_enqueue_script( 'todo_notes_single' );
		wp_localize_script( 'todo_notes_note', 'responsivestickynotes_vars', array(
				//nonce will be available as MyAjax.[nonce name] in javascript
				'postNoteNonce' => wp_create_nonce( 'myajax-post-note-nonce' ),
				'pageId' => get_the_ID(),
				'nextId' => RESPONSIVESTICKYNOTES_note::get_next_ID(),
				'close' => __('Close', 'responsive-sticky-notes'),
				'more' => __('More', 'responsive-sticky-notes'),
				'menu' => __('Menu', 'responsive-sticky-notes'),
				'bin_note' => __('Bin note', 'responsive-sticky-notes'),
				'set_note_color' => __('Set note color', 'responsive-sticky-notes'),
				'untitled_note' => __('Untitled note', 'responsive-sticky-notes'),
				'delete_this_note' => __('Delete this note?', 'responsive-sticky-notes')
		));
		wp_enqueue_style( 'responsivestickynotes_styles',  plugins_url('/css/responsive-sticky-notes.css', __FILE__ ) );
	}
}
function responsivestickynotes_ajaxurl() {
	if (!is_admin()) {
		//ajaxurl is only defined if logged in, by default
		echo '<script type="text/javascript">';
		echo "var ajaxurl = '" . admin_url('admin-ajax.php') ."'";
		echo '</script>';
	}
}
// add a link to the WP Toolbar
function responsivestickynotes_add_admin_button($wp_admin_bar) {
	$args = array(
			'id' => 'addnote',
			'title' => '<span class="responsivestickynotes-button-text">'.__('Add  Note', 'responsive-sticky-notes').'</span><span class="responsivestickynotes-button-text-active">'.__('Stop adding note', 'responsive-sticky-notes').'</span>',
			'href' => '#',
			'meta' => array(
					'title' => __('Add a new Note', 'responsive-sticky-notes'),
					'onclick' => 'responsivestickynotes_add_note()'
			)
	);
	$wp_admin_bar->add_node($args);
}
//Adding add note button to front end
function responsivestickynotes_add_button() {
	if(get_option( 'pix-to-pos-setting' )==='position-selection'){
		return;
	}
	else{
	?>
	<div class="addnote-responsivestickynote-<?php echo get_option( 'pix-to-pos-setting' );?>">
		<button id="addnote-to-front" onclick="responsivestickynotes_add_note()">
		<span id="addnote-to-front-span">Add Note</span>
	</button>
	</div><?php
	}
}
//Creating a custom post type
function responsivestickynotes_create_posttype() {
	RESPONSIVESTICKYNOTES_note::register_post_type();
}
